import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, rawQuery?: string) {
    const query = rawQuery?.trim() ?? '';

    if (query.length < 2) {
      return {
        query,
        properties: [],
        rooms: [],
        entries: [],
        documents: [],
      };
    }

    /*
     * Tagi zapisujemy znormalizowane małymi literami,
     * więc dla wyszukiwania po tagu robimy to samo.
     */
    const normalizedTag = query.toLowerCase();

    const [properties, rooms, entries, documents] = await Promise.all([
      /*
       * NIERUCHOMOŚCI
       */
      this.prisma.property.findMany({
        where: {
          ownerId: userId,

          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              address: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },

        select: {
          id: true,
          name: true,
          address: true,
          yearBuilt: true,
        },

        orderBy: {
          name: 'asc',
        },

        take: 20,
      }),

      /*
       * POMIESZCZENIA
       */
      this.prisma.room.findMany({
        where: {
          property: {
            ownerId: userId,
          },

          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              floor: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },

        select: {
          id: true,
          name: true,
          floor: true,
          description: true,
          propertyId: true,

          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          name: 'asc',
        },

        take: 20,
      }),

      /*
       * WPISY
       *
       * Szukamy po:
       * - tytule
       * - opisie
       * - tagu
       */
      this.prisma.entry.findMany({
        where: {
          room: {
            property: {
              ownerId: userId,
            },
          },

          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },

            {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },

            {
              tags: {
                has: normalizedTag,
              },
            },
          ],
        },

        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          tags: true,
          roomId: true,
          createdAt: true,
          updatedAt: true,

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

        orderBy: {
          updatedAt: 'desc',
        },

        take: 30,
      }),

      /*
       * DOKUMENTY
       *
       * Na tym etapie wyszukujemy po nazwie pliku.
       * Później OCR pozwoli szukać również
       * po treści dokumentu.
       */
      this.prisma.attachment.findMany({
        where: {
          kind: 'DOCUMENT',

          fileName: {
            contains: query,
            mode: 'insensitive',
          },

          entry: {
            room: {
              property: {
                ownerId: userId,
              },
            },
          },
        },

        select: {
          id: true,
          fileName: true,
          storagePath: true,
          mimeType: true,
          size: true,
          kind: true,
          entryId: true,
          createdAt: true,

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
          createdAt: 'desc',
        },

        take: 20,
      }),
    ]);

    return {
      query,
      properties,
      rooms,
      entries,
      documents,
    };
  }
}
