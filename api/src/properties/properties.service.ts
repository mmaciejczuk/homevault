import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.property.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const property = await this.prisma.property.findUnique({
      where: {
        id,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  create(dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        name: dto.name,
        address: dto.address,
        yearBuilt: dto.yearBuilt,
      },
    });
  }
}