import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateDeviceDto } from './dto/create-device.dto';

import type { UpdateDeviceDto } from './dto/update-device.dto';

import type {
  CreateServiceRecordDto,
  ServiceType,
} from './dto/create-service-record.dto';

import type { UpdateServiceRecordDto } from './dto/update-service-record.dto';

const SERVICE_TYPES: ServiceType[] = [
  'INSTALLATION',
  'INSPECTION',
  'REPAIR',
  'MAINTENANCE',
  'OTHER',
];

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntry(entryId: number, ownerId: string) {
    const entry = await this.findOwnedEntry(entryId, ownerId);

    const device = await this.prisma.device.findUnique({
      where: {
        entryId: entry.id,
      },

      include: {
        serviceRecords: {
          orderBy: {
            serviceDate: 'desc',
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  async create(entryId: number, dto: CreateDeviceDto, ownerId: string) {
    const entry = await this.findOwnedEntry(entryId, ownerId);

    const existing = await this.prisma.device.findUnique({
      where: {
        entryId,
      },

      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException('Device already exists for this entry');
    }

    const purchaseDate = this.parseOptionalDate(
      dto.purchaseDate,
      'purchaseDate',
    );

    const installedAt = this.parseOptionalDate(dto.installedAt, 'installedAt');

    const warrantyUntil = this.parseOptionalDate(
      dto.warrantyUntil,
      'warrantyUntil',
    );

    this.validateMoney(dto.purchasePriceCents, 'purchasePriceCents');

    return this.prisma.device.create({
      data: {
        entryId: entry.id,

        manufacturer: this.normalizeOptionalText(dto.manufacturer),

        model: this.normalizeOptionalText(dto.model),

        serialNumber: this.normalizeOptionalText(dto.serialNumber),

        purchaseDate,

        installedAt,

        warrantyUntil,

        purchasePriceCents: dto.purchasePriceCents,

        contractorName: this.normalizeOptionalText(dto.contractorName),
      },

      include: {
        serviceRecords: true,
      },
    });
  }

  async update(id: number, dto: UpdateDeviceDto, ownerId: string) {
    await this.findOwnedDevice(id, ownerId);

    if (
      dto.purchasePriceCents !== undefined &&
      dto.purchasePriceCents !== null
    ) {
      this.validateMoney(dto.purchasePriceCents, 'purchasePriceCents');
    }

    return this.prisma.device.update({
      where: {
        id,
      },

      data: {
        ...(dto.manufacturer !== undefined
          ? {
              manufacturer: this.normalizeNullableText(dto.manufacturer),
            }
          : {}),

        ...(dto.model !== undefined
          ? {
              model: this.normalizeNullableText(dto.model),
            }
          : {}),

        ...(dto.serialNumber !== undefined
          ? {
              serialNumber: this.normalizeNullableText(dto.serialNumber),
            }
          : {}),

        ...(dto.purchaseDate !== undefined
          ? {
              purchaseDate: this.parseNullableDate(
                dto.purchaseDate,
                'purchaseDate',
              ),
            }
          : {}),

        ...(dto.installedAt !== undefined
          ? {
              installedAt: this.parseNullableDate(
                dto.installedAt,
                'installedAt',
              ),
            }
          : {}),

        ...(dto.warrantyUntil !== undefined
          ? {
              warrantyUntil: this.parseNullableDate(
                dto.warrantyUntil,
                'warrantyUntil',
              ),
            }
          : {}),

        ...(dto.purchasePriceCents !== undefined
          ? {
              purchasePriceCents: dto.purchasePriceCents,
            }
          : {}),

        ...(dto.contractorName !== undefined
          ? {
              contractorName: this.normalizeNullableText(dto.contractorName),
            }
          : {}),
      },

      include: {
        serviceRecords: {
          orderBy: {
            serviceDate: 'desc',
          },
        },
      },
    });
  }

  async remove(id: number, ownerId: string) {
    await this.findOwnedDevice(id, ownerId);

    await this.prisma.device.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      id,
    };
  }

  async findServiceRecords(deviceId: number, ownerId: string) {
    await this.findOwnedDevice(deviceId, ownerId);

    return this.prisma.serviceRecord.findMany({
      where: {
        deviceId,
      },

      orderBy: {
        serviceDate: 'desc',
      },
    });
  }

  async createServiceRecord(
    deviceId: number,
    dto: CreateServiceRecordDto,
    ownerId: string,
  ) {
    await this.findOwnedDevice(deviceId, ownerId);

    if (!SERVICE_TYPES.includes(dto.type)) {
      throw new BadRequestException('Invalid service type');
    }

    const serviceDate = this.parseRequiredDate(dto.serviceDate, 'serviceDate');

    const nextServiceDate = this.parseOptionalDate(
      dto.nextServiceDate,
      'nextServiceDate',
    );

    this.validateMoney(dto.costCents, 'costCents');

    return this.prisma.serviceRecord.create({
      data: {
        deviceId,

        type: dto.type,

        serviceDate,

        description: this.normalizeOptionalText(dto.description),

        contractorName: this.normalizeOptionalText(dto.contractorName),

        costCents: dto.costCents,

        nextServiceDate,
      },
    });
  }

  async updateServiceRecord(
    id: number,
    dto: UpdateServiceRecordDto,
    ownerId: string,
  ) {
    await this.findOwnedServiceRecord(id, ownerId);

    if (dto.type !== undefined && !SERVICE_TYPES.includes(dto.type)) {
      throw new BadRequestException('Invalid service type');
    }

    if (dto.costCents !== undefined && dto.costCents !== null) {
      this.validateMoney(dto.costCents, 'costCents');
    }

    return this.prisma.serviceRecord.update({
      where: {
        id,
      },

      data: {
        ...(dto.type !== undefined
          ? {
              type: dto.type,
            }
          : {}),

        ...(dto.serviceDate !== undefined
          ? {
              serviceDate: this.parseRequiredDate(
                dto.serviceDate,
                'serviceDate',
              ),
            }
          : {}),

        ...(dto.description !== undefined
          ? {
              description: this.normalizeNullableText(dto.description),
            }
          : {}),

        ...(dto.contractorName !== undefined
          ? {
              contractorName: this.normalizeNullableText(dto.contractorName),
            }
          : {}),

        ...(dto.costCents !== undefined
          ? {
              costCents: dto.costCents,
            }
          : {}),

        ...(dto.nextServiceDate !== undefined
          ? {
              nextServiceDate: this.parseNullableDate(
                dto.nextServiceDate,
                'nextServiceDate',
              ),
            }
          : {}),
      },
    });
  }

  async removeServiceRecord(id: number, ownerId: string) {
    await this.findOwnedServiceRecord(id, ownerId);

    await this.prisma.serviceRecord.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      id,
    };
  }

  private async findOwnedEntry(entryId: number, ownerId: string) {
    const entry = await this.prisma.entry.findFirst({
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
      throw new NotFoundException('Entry not found');
    }

    return entry;
  }

  private async findOwnedDevice(id: number, ownerId: string) {
    const device = await this.prisma.device.findFirst({
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

      select: {
        id: true,
        entryId: true,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  private async findOwnedServiceRecord(id: number, ownerId: string) {
    const record = await this.prisma.serviceRecord.findFirst({
      where: {
        id,

        device: {
          entry: {
            room: {
              property: {
                ownerId,
              },
            },
          },
        },
      },

      select: {
        id: true,
        deviceId: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Service record not found');
    }

    return record;
  }

  private parseRequiredDate(value: string, fieldName: string) {
    if (!value) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} is invalid`);
    }

    return date;
  }

  private parseOptionalDate(value: string | undefined, fieldName: string) {
    if (value === undefined || value === '') {
      return undefined;
    }

    return this.parseRequiredDate(value, fieldName);
  }

  private parseNullableDate(value: string | null, fieldName: string) {
    if (value === null || value === '') {
      return null;
    }

    return this.parseRequiredDate(value, fieldName);
  }

  private validateMoney(value: number | undefined | null, fieldName: string) {
    if (value === undefined || value === null) {
      return;
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException(
        `${fieldName} must be a non-negative integer`,
      );
    }
  }

  private normalizeOptionalText(value: string | undefined) {
    if (value === undefined) {
      return undefined;
    }

    return value.trim() || undefined;
  }

  private normalizeNullableText(value: string | null) {
    if (value === null) {
      return null;
    }

    return value.trim() || null;
  }
}
