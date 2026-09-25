import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type {
  CreateEntryDto,
  EntryCategory,
} from './dto/create-entry.dto';

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
    private readonly prisma: PrismaService,
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
        title: dto.title.trim(),

        description:
          dto.description?.trim() ||
          undefined,

        category: dto.category,
        roomId,
      },
    });
  }
}