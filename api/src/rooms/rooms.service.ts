import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findByProperty(propertyId: number) {
    const property = await this.prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
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

  async findOne(id: number) {
    const room = await this.prisma.room.findUnique({
      where: {
        id,
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
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async create(
    propertyId: number,
    dto: CreateRoomDto,
  ) {
    const property = await this.prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
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