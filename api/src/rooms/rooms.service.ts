import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type {
  CreateRoomDto,
} from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findByProperty(
    propertyId: number,
    ownerId: string,
  ) {
    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,
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
        createdAt: 'asc',
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
          id: propertyId,
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

    return this.prisma.room.create({
      data: {
        name: dto.name,
        floor: dto.floor,
        description: dto.description,
        propertyId,
      },
    });
  }
}