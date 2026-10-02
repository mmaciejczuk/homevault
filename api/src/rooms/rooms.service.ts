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
  CreateRoomDto,
} from './dto/create-room.dto';

import type {
  UpdateRoomDto,
} from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly storage:
      StorageService,
  ) {}

  async findByProperty(
    propertyId: number,
    ownerId: string,
  ) {
    const property =
      await this.prisma.property.findFirst({
        where: {
          id:
            propertyId,

          ownerId,
        },

        select: {
          id: true,
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    return this.prisma.room.findMany({
      where: {
        propertyId,
      },

      orderBy: {
        createdAt:
          'desc',
      },
    });
  }

  async findOne(
    id: number,
    ownerId: string,
  ) {
    const room =
      await this.prisma.room.findFirst({
        where: {
          id,

          property: {
            ownerId,
          },
        },

        include: {
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (!room) {
      throw new NotFoundException(
        'Room not found',
      );
    }

    return room;
  }

  async create(
    propertyId: number,
    dto: CreateRoomDto,
    ownerId: string,
  ) {
    const property =
      await this.prisma.property.findFirst({
        where: {
          id:
            propertyId,

          ownerId,
        },

        select: {
          id: true,
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    if (!dto.name?.trim()) {
      throw new BadRequestException(
        'Room name is required',
      );
    }

    return this.prisma.room.create({
      data: {
        name:
          dto.name.trim(),

        floor:
          dto.floor?.trim() ||
          undefined,

        description:
          dto.description?.trim() ||
          undefined,

        propertyId,
      },
    });
  }

  async update(
    id: number,
    dto: UpdateRoomDto,
    ownerId: string,
  ) {
    const room =
      await this.prisma.room.findFirst({
        where: {
          id,

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

    if (
      dto.name !== undefined &&
      !dto.name.trim()
    ) {
      throw new BadRequestException(
        'Room name cannot be empty',
      );
    }

    return this.prisma.room.update({
      where: {
        id,
      },

      data: {
        ...(dto.name !== undefined
          ? {
              name:
                dto.name.trim(),
            }
          : {}),

        ...(dto.floor !== undefined
          ? {
              floor:
                dto.floor?.trim() ||
                null,
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
      },
    });
  }

  async remove(
    id: number,
    ownerId: string,
  ) {
    const room =
      await this.prisma.room.findFirst({
        where: {
          id,

          property: {
            ownerId,
          },
        },

        include: {
          entries: {
            include: {
              attachments: {
                select: {
                  storagePath:
                    true,
                },
              },
            },
          },
        },
      });

    if (!room) {
      throw new NotFoundException(
        'Room not found',
      );
    }

    const storagePaths =
      room.entries.flatMap(
        (
          entry,
        ) =>
          entry.attachments.map(
            (
              attachment,
            ) =>
              attachment
                .storagePath,
          ),
      );

    if (
      storagePaths.length > 0
    ) {
      await this.storage.removeMany(
        storagePaths,
      );
    }

    await this.prisma.room.delete({
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