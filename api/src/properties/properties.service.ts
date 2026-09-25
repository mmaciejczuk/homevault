import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type {
  CreatePropertyDto,
} from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll(ownerId: string) {
    return this.prisma.property.findMany({
      where: {
        ownerId,
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

  create(
    dto: CreatePropertyDto,
    ownerId: string,
  ) {
    return this.prisma.property.create({
      data: {
        name: dto.name,
        address: dto.address,
        yearBuilt: dto.yearBuilt,

        ownerId,
      },
    });
  }
}