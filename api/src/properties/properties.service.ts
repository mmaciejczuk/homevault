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
  CreatePropertyDto,
} from './dto/create-property.dto';

import type {
  UpdatePropertyDto,
} from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly storage:
      StorageService,
  ) {}

  findAll(
    ownerId: string,
  ) {
    return this.prisma.property.findMany({
      where: {
        ownerId,
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
    const property =
      await this.prisma.property.findFirst({
        where: {
          id,
          ownerId,
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    return property;
  }

  async create(
    dto: CreatePropertyDto,
    ownerId: string,
  ) {
    if (!dto.name?.trim()) {
      throw new BadRequestException(
        'Property name is required',
      );
    }

    if (
      dto.yearBuilt !== undefined &&
      (
        !Number.isInteger(
          dto.yearBuilt,
        ) ||
        dto.yearBuilt < 1000 ||
        dto.yearBuilt > 9999
      )
    ) {
      throw new BadRequestException(
        'Invalid year built',
      );
    }

    return this.prisma.property.create({
      data: {
        name:
          dto.name.trim(),

        address:
          dto.address?.trim() ||
          undefined,

        yearBuilt:
          dto.yearBuilt,

        ownerId,
      },
    });
  }

  async update(
    id: number,
    dto: UpdatePropertyDto,
    ownerId: string,
  ) {
    const property =
      await this.prisma.property.findFirst({
        where: {
          id,
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

    if (
      dto.name !== undefined &&
      !dto.name.trim()
    ) {
      throw new BadRequestException(
        'Property name cannot be empty',
      );
    }

    if (
      dto.yearBuilt !== undefined &&
      dto.yearBuilt !== null &&
      (
        !Number.isInteger(
          dto.yearBuilt,
        ) ||
        dto.yearBuilt < 1000 ||
        dto.yearBuilt > 9999
      )
    ) {
      throw new BadRequestException(
        'Invalid year built',
      );
    }

    return this.prisma.property.update({
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

        ...(dto.address !== undefined
          ? {
              address:
                dto.address?.trim() ||
                null,
            }
          : {}),

        ...(dto.yearBuilt !== undefined
          ? {
              yearBuilt:
                dto.yearBuilt,
            }
          : {}),
      },
    });
  }

  async remove(
    id: number,
    ownerId: string,
  ) {
    const property =
      await this.prisma.property.findFirst({
        where: {
          id,
          ownerId,
        },

        include: {
          rooms: {
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
          },
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    const storagePaths =
      property.rooms.flatMap(
        (
          room,
        ) =>
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
          ),
      );

    if (
      storagePaths.length > 0
    ) {
      await this.storage.removeMany(
        storagePaths,
      );
    }

    await this.prisma.property.delete({
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