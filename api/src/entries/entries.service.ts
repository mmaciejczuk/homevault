import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  StorageService,
} from '../storage/storage.service';

import type {
  CreateEntryDto,
  EntryCategory,
} from './dto/create-entry.dto';

import type {
  UpdateEntryDto,
} from './dto/update-entry.dto';

const ENTRY_CATEGORIES: EntryCategory[] = [
  'ELECTRICAL',
  'PLUMBING',
  'HEATING',
  'WALL',
  'FLOOR',
  'DEVICE',
  'NOTE',
  'OTHER',
];

@Injectable()
export class EntriesService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly storage:
      StorageService,
  ) {}

  async findByRoom(
    roomId: number,
    ownerId: string,
  ) {
    const room =
      await this.prisma.room.findFirst({
        where: {
          id: roomId,

          property: {
            ownerId,
          },
        },

        select: {
          id: true,
        },
      });

    if (!room) {
      throw new NotFoundException(
        'Room not found',
      );
    }

    return this.prisma.entry.findMany({
      where: {
        roomId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    id: number,
    ownerId: string,
  ) {
    const entry =
      await this.prisma.entry.findFirst({
        where: {
          id,

          room: {
            property: {
              ownerId,
            },
          },
        },

        include: {
          room: {
            select: {
              id: true,
              name: true,
              propertyId: true,
            },
          },
        },
      });

    if (!entry) {
      throw new NotFoundException(
        'Entry not found',
      );
    }

    return entry;
  }

  async create(
    roomId: number,
    dto: CreateEntryDto,
    ownerId: string,
  ) {
    const room =
      await this.prisma.room.findFirst({
        where: {
          id: roomId,

          property: {
            ownerId,
          },
        },

        select: {
          id: true,
        },
      });

    if (!room) {
      throw new NotFoundException(
        'Room not found',
      );
    }

    if (!dto.title?.trim()) {
      throw new BadRequestException(
        'Entry title is required',
      );
    }

    if (
      !ENTRY_CATEGORIES.includes(
        dto.category,
      )
    ) {
      throw new BadRequestException(
        'Invalid entry category',
      );
    }

    return this.prisma.entry.create({
      data: {
        title:
          dto.title.trim(),

        description:
          dto.description?.trim() ||
          undefined,

        category:
          dto.category,

        roomId,
      },
    });
  }

  async update(
    id: number,
    dto: UpdateEntryDto,
    ownerId: string,
  ) {
    const entry =
      await this.prisma.entry.findFirst({
        where: {
          id,

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

    if (
      dto.title !== undefined &&
      !dto.title.trim()
    ) {
      throw new BadRequestException(
        'Entry title cannot be empty',
      );
    }

    if (
      dto.category !== undefined &&
      !ENTRY_CATEGORIES.includes(
        dto.category,
      )
    ) {
      throw new BadRequestException(
        'Invalid entry category',
      );
    }

    return this.prisma.entry.update({
      where: {
        id,
      },

      data: {
        ...(dto.title !== undefined
          ? {
              title:
                dto.title.trim(),
            }
          : {}),

        ...(dto.description !==
        undefined
          ? {
              description:
                dto.description
                  ?.trim() ||
                null,
            }
          : {}),

        ...(dto.category !== undefined
          ? {
              category:
                dto.category,
            }
          : {}),
      },
    });
  }

  async remove(
    id: number,
    ownerId: string,
  ) {
    const entry =
      await this.prisma.entry.findFirst({
        where: {
          id,

          room: {
            property: {
              ownerId,
            },
          },
        },

        include: {
          attachments: {
            select: {
              storagePath: true,
            },
          },
        },
      });

    if (!entry) {
      throw new NotFoundException(
        'Entry not found',
      );
    }

    const storagePaths =
      entry.attachments.map(
        (
          attachment,
        ) =>
          attachment.storagePath,
      );

    if (
      storagePaths.length > 0
    ) {
      await this.storage.removeMany(
        storagePaths,
      );
    }

    await this.prisma.entry.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      id,
    };
  }
}