import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  StorageService,
} from '../storage/storage.service';

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly prisma:
      PrismaService,

    private readonly storage:
      StorageService,
  ) {
    const supabaseUrl =
      process.env.SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl) {
      throw new Error(
        'Brak SUPABASE_URL',
      );
    }

    if (!supabaseSecretKey) {
      throw new Error(
        'Brak SUPABASE_SECRET_KEY',
      );
    }

    this.supabase =
      createClient(
        supabaseUrl,
        supabaseSecretKey,
        {
          auth: {
            autoRefreshToken:
              false,

            persistSession:
              false,

            detectSessionInUrl:
              false,
          },
        },
      );
  }

  async deleteAccount(
    userId: string,
  ) {
    /*
     * Najpierw pobieramy wszystkie
     * attachmenty należące do usera,
     * zanim usuniemy dane z DB.
     */
    const attachments =
      await this.prisma
        .attachment
        .findMany({
          where: {
            entry: {
              room: {
                property: {
                  ownerId:
                    userId,
                },
              },
            },
          },

          select: {
            id: true,
            storagePath: true,
          },
        });

    /*
     * Najpierw Storage.
     *
     * Jeśli ten krok się nie uda,
     * NIE usuwamy danych DB ani konta.
     */
    if (
      attachments.length > 0
    ) {
      await this.storage
        .removeMany(
          attachments.map(
            (
              attachment,
            ) =>
              attachment
                .storagePath,
          ),
        );
    }

    /*
     * Property jest rootem danych
     * HomeVault.
     *
     * Prisma cascade:
     *
     * Property
     * -> Room
     * -> Entry
     * -> Attachment
     */
    try {
      await this.prisma
        .$transaction(
          async (
            transaction,
          ) => {
            await transaction
              .property
              .deleteMany({
                where: {
                  ownerId:
                    userId,
                },
              });
          },
        );
    } catch (error) {
      console.error(
        'Account DB deletion failed:',
        error,
      );

      /*
       * Storage został już usunięty.
       *
       * Nie usuwamy konta Auth,
       * żeby użytkownik nadal mógł
       * wejść i żeby nie powstało
       * osierocone konto aplikacyjne.
       */
      throw new InternalServerErrorException(
        'Nie udało się usunąć danych konta.',
      );
    }

    /*
     * Na końcu usuwamy konto Supabase Auth.
     */
    const {
      error:
        deleteUserError,
    } =
      await this.supabase.auth
        .admin.deleteUser(
          userId,
        );

    if (deleteUserError) {
      console.error(
        'Supabase Auth user deletion failed:',
        deleteUserError,
      );

      throw new InternalServerErrorException(
        'Dane konta zostały usunięte, ale nie udało się usunąć konta logowania.',
      );
    }

    return {
      success: true,
    };
  }
}