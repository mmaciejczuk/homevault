import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttention(ownerId: string) {
    const today = this.startOfToday();

    const horizon = new Date(today);

    horizon.setUTCDate(horizon.getUTCDate() + 60);

    const [serviceRecords, devices] = await Promise.all([
      this.prisma.serviceRecord.findMany({
        where: {
          nextServiceDate: {
            not: null,
            lte: horizon,
          },

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
          type: true,
          serviceDate: true,
          nextServiceDate: true,
          contractorName: true,

          device: {
            select: {
              id: true,
              manufacturer: true,
              model: true,
              serialNumber: true,
              entryId: true,

              entry: {
                select: {
                  id: true,
                  title: true,

                  room: {
                    select: {
                      id: true,
                      name: true,

                      property: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          nextServiceDate: 'asc',
        },

        take: 30,
      }),

      this.prisma.device.findMany({
        where: {
          warrantyUntil: {
            not: null,
            lte: horizon,
          },

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
          manufacturer: true,
          model: true,
          serialNumber: true,
          warrantyUntil: true,
          entryId: true,

          entry: {
            select: {
              id: true,
              title: true,

              room: {
                select: {
                  id: true,
                  name: true,

                  property: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          warrantyUntil: 'asc',
        },

        take: 30,
      }),
    ]);

    const serviceReminders = serviceRecords.map((record) => {
      const date = record.nextServiceDate!;

      const daysUntil = this.daysBetween(today, date);

      return {
        id: record.id,

        kind: 'SERVICE' as const,

        status:
          daysUntil < 0 ? 'OVERDUE' : daysUntil <= 14 ? 'SOON' : 'UPCOMING',

        date,

        daysUntil,

        serviceType: record.type,

        contractorName: record.contractorName,

        device: {
          id: record.device.id,

          manufacturer: record.device.manufacturer,

          model: record.device.model,

          serialNumber: record.device.serialNumber,

          entryId: record.device.entryId,
        },

        entry: record.device.entry,
      };
    });

    const warrantyReminders = devices.map((device) => {
      const date = device.warrantyUntil!;

      const daysUntil = this.daysBetween(today, date);

      return {
        id: device.id,

        kind: 'WARRANTY' as const,

        status:
          daysUntil < 0 ? 'EXPIRED' : daysUntil <= 14 ? 'SOON' : 'UPCOMING',

        date,

        daysUntil,

        device: {
          id: device.id,

          manufacturer: device.manufacturer,

          model: device.model,

          serialNumber: device.serialNumber,

          entryId: device.entryId,
        },

        entry: device.entry,
      };
    });

    return {
      generatedAt: new Date().toISOString(),

      horizonDays: 60,

      counts: {
        service: serviceReminders.length,

        warranty: warrantyReminders.length,

        overdueService: serviceReminders.filter(
          (item) => item.status === 'OVERDUE',
        ).length,

        expiredWarranty: warrantyReminders.filter(
          (item) => item.status === 'EXPIRED',
        ).length,
      },

      serviceReminders,

      warrantyReminders,
    };
  }

  private startOfToday() {
    const now = new Date();

    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }

  private daysBetween(from: Date, to: Date) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return Math.ceil((to.getTime() - from.getTime()) / millisecondsPerDay);
  }
}
