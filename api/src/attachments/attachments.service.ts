import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  randomUUID,
} from 'node:crypto';

import {
  extname,
} from 'node:path';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  StorageService,
} from '../storage/storage.service';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly storage:
      StorageService,
  ) {}

  async findByEntry(
    entryId: number,
    ownerId: string,
  ) {
    const entry =
      await this.prisma.entry
        .findFirst({
          where: {
            id: entryId,

            room: {
              property: {
                ownerId,
              },
            },
          },

          select: {
            id: true,
          },
        });

    if (!entry) {
      throw new NotFoundException(
        'Entry not found',
      );
    }

    const attachments =
      await this.prisma
        .attachment
        .findMany({
          where: {
            entryId,
          },

          orderBy: {
            createdAt:
              'desc',
          },
        });

    return Promise.all(
      attachments.map(
        async (
          attachment,
        ) => {
          const url =
            await this.storage
              .createSignedUrl(
                attachment.storagePath,
              );

          return {
            ...attachment,
            url,
          };
        },
      ),
    );
  }

  async upload(
    entryId: number,
    file: Express.Multer.File,
    ownerId: string,
  ) {
    const entry =
      await this.prisma.entry
        .findFirst({
          where: {
            id: entryId,

            room: {
              property: {
                ownerId,
              },
            },
          },

          select: {
            id: true,
          },
        });

    if (!entry) {
      throw new NotFoundException(
        'Entry not found',
      );
    }

    if (!file) {
      throw new BadRequestException(
        'File is required',
      );
    }

    if (
      !file.mimetype.startsWith(
        'image/',
      )
    ) {
      throw new BadRequestException(
        'Only image files are supported',
      );
    }

    const originalExtension =
      extname(
        file.originalname,
      ).toLowerCase();

    const extension =
      originalExtension ||
      '.jpg';

    const storagePath =
      `entries/${entryId}/` +
      `${randomUUID()}${extension}`;

    let attachment:
      | {
          id: number;
          fileName: string;
          storagePath: string;
          mimeType: string;
          size: number;
          kind:
            | 'IMAGE'
            | 'DOCUMENT';
          entryId: number;
          createdAt: Date;
        }
      | undefined;

    try {
      await this.storage.upload(
        storagePath,
        file.buffer,
        file.mimetype,
      );

      attachment =
        await this.prisma
          .attachment
          .create({
            data: {
              fileName:
                file.originalname,

              storagePath,

              mimeType:
                file.mimetype,

              size:
                file.size,

              kind:
                'IMAGE',

              entryId,
            },
          });

      const url =
        await this.storage
          .createSignedUrl(
            attachment.storagePath,
          );

      return {
        ...attachment,
        url,
      };
    } catch (error) {
      /*
       * Jeśli rekord DB zdążył
       * powstać, usuwamy go.
       */
      if (attachment) {
        await this.prisma
          .attachment
          .delete({
            where: {
              id:
                attachment.id,
            },
          })
          .catch(
            (
              cleanupError,
            ) => {
              console.error(
                'Attachment DB rollback failed:',
                cleanupError,
              );
            },
          );
      }

      /*
       * Usuwamy storagePath również
       * po błędzie samego uploadu.
       *
       * Przy 504 istnieje możliwość,
       * że serwer zapisał plik,
       * ale odpowiedź nie dotarła.
       */
      await this.storage
        .remove(
          storagePath,
        )
        .catch(
          (
            cleanupError,
          ) => {
            console.error(
              'Storage rollback failed:',
              cleanupError,
            );
          },
        );

      throw error;
    }
  }

  async remove(
    id: number,
    ownerId: string,
  ) {
    const attachment =
      await this.prisma
        .attachment
        .findFirst({
          where: {
            id,

            entry: {
              room: {
                property: {
                  ownerId,
                },
              },
            },
          },
        });

    if (!attachment) {
      throw new NotFoundException(
        'Attachment not found',
      );
    }

    await this.storage.remove(
      attachment.storagePath,
    );

    await this.prisma
      .attachment
      .delete({
        where: {
          id:
            attachment.id,
        },
      });

    return {
      success: true,
      id:
        attachment.id,
    };
  }
}