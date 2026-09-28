import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { createClient } from '@supabase/supabase-js';

import { PrismaService } from '../prisma/prisma.service';

const STORAGE_BUCKET = 'entry-attachments';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async deleteAccount(
    userId: string,
  ) {
    const supabaseUrl =
      process.env.SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl) {
      throw new InternalServerErrorException(
        'SUPABASE_URL is not configured.',
      );
    }

    if (!supabaseSecretKey) {
      throw new InternalServerErrorException(
        'SUPABASE_SECRET_KEY is not configured.',
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        supabaseSecretKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        },
      );

    /*
     * Najpierw pobieramy wszystkie pliki,
     * które należą do użytkownika.
     *
     * Po usunięciu rekordów z bazy
     * nie mielibyśmy już storagePath.
     */
    const attachments =
      await this.prisma.attachment.findMany({
        where: {
          entry: {
            room: {
              property: {
                ownerId: userId,
              },
            },
          },
        },
        select: {
          storagePath: true,
        },
      });

    const storagePaths =
      attachments.map(
        (attachment) =>
          attachment.storagePath,
      );

    /*
     * Supabase Storage usuwa pliki
     * przez listę ścieżek.
     *
     * Dzielimy je na paczki,
     * żeby nie wysyłać ogromnego
     * requestu przy większym koncie.
     */
    const batchSize = 100;

    for (
      let index = 0;
      index < storagePaths.length;
      index += batchSize
    ) {
      const paths =
        storagePaths.slice(
          index,
          index + batchSize,
        );

      const {
        error: storageError,
      } =
        await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .remove(paths);

      if (storageError) {
        console.error(
          'Błąd usuwania plików Storage:',
          storageError,
        );

        throw new InternalServerErrorException(
          'Nie udało się usunąć plików użytkownika.',
        );
      }
    }

    /*
     * Dane aplikacyjne usuwamy
     * atomowo w transakcji.
     *
     * Robimy to jawnie od dzieci
     * do rodzica zamiast polegać
     * wyłącznie na CASCADE.
     */
    await this.prisma.$transaction([
      this.prisma.attachment.deleteMany({
        where: {
          entry: {
            room: {
              property: {
                ownerId: userId,
              },
            },
          },
        },
      }),

      this.prisma.entry.deleteMany({
        where: {
          room: {
            property: {
              ownerId: userId,
            },
          },
        },
      }),

      this.prisma.room.deleteMany({
        where: {
          property: {
            ownerId: userId,
          },
        },
      }),

      this.prisma.property.deleteMany({
        where: {
          ownerId: userId,
        },
      }),
    ]);

    /*
     * Konto Supabase Auth usuwamy
     * na końcu.
     *
     * W tym momencie użytkownik
     * nie posiada już danych ani
     * obiektów Storage.
     */
    const {
      error: authError,
    } =
      await supabaseAdmin.auth.admin
        .deleteUser(
          userId,
        );

    if (authError) {
      console.error(
        'Błąd usuwania użytkownika Supabase:',
        authError,
      );

      throw new InternalServerErrorException(
        'Dane zostały usunięte, ale nie udało się usunąć konta uwierzytelniania.',
      );
    }

    return {
      deleted: true,
    };
  }
}