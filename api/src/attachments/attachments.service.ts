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

type AttachmentKind =
  | 'IMAGE'
  | 'DOCUMENT';

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

    const kind =
      this.getAttachmentKind(
        file,
      );

    const extension =
      this.getExtension(
        file,
        kind,
      );

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
            AttachmentKind;
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

              kind,

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

  private getAttachmentKind(
    file: Express.Multer.File,
  ): AttachmentKind {
    if (
      file.mimetype.startsWith(
        'image/',
      )
    ) {
      return 'IMAGE';
    }

    if (
      file.mimetype ===
      'application/pdf'
    ) {
      return 'DOCUMENT';
    }

    throw new BadRequestException(
      'Only image and PDF files are supported',
    );
  }

  private getExtension(
    file: Express.Multer.File,
    kind: AttachmentKind,
  ) {
    const originalExtension =
      extname(
        file.originalname,
      ).toLowerCase();

    if (
      originalExtension
    ) {
      return originalExtension;
    }

    if (
      kind ===
      'DOCUMENT'
    ) {
      return '.pdf';
    }

    return this.getImageExtension(
      file.mimetype,
    );
  }

  private getImageExtension(
    mimeType: string,
  ) {
    switch (
      mimeType.toLowerCase()
    ) {
      case 'image/png':
        return '.png';

      case 'image/webp':
        return '.webp';

      case 'image/gif':
        return '.gif';

      case 'image/heic':
        return '.heic';

      case 'image/heif':
        return '.heif';

      case 'image/jpeg':
      case 'image/jpg':
      default:
        return '.jpg';
    }
  }
}