import {
  Injectable,
} from '@nestjs/common';

import {
  PrismaService,
} from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async search(
    query: string,
    ownerId: string,
  ) {
    const q =
      query.trim();

    if (
      q.length < 2
    ) {
      return {
        query: q,
        properties: [],
        rooms: [],
        entries: [],
        documents: [],
      };
    }

    const [
      properties,
      rooms,
      entries,
      documents,
    ] =
      await Promise.all([
        this.prisma.property.findMany({
          where: {
            ownerId,

            OR: [
              {
                name: {
                  contains: q,
                  mode:
                    'insensitive',
                },
              },

              {
                address: {
                  contains: q,
                  mode:
                    'insensitive',
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

        this.prisma.room.findMany({
          where: {
            property: {
              ownerId,
            },

            OR: [
              {
                name: {
                  contains: q,
                  mode:
                    'insensitive',
                },
              },

              {
                floor: {
                  contains: q,
                  mode:
                    'insensitive',
                },
              },

              {
                description: {
                  contains: q,
                  mode:
                    'insensitive',
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

        this.prisma.entry.findMany({
          where: {
            room: {
              property: {
                ownerId,
              },
            },

            OR: [
              {
                title: {
                  contains: q,
                  mode:
                    'insensitive',
                },
              },

              {
                description: {
                  contains: q,
                  mode:
                    'insensitive',
                },
              },
            ],
          },

          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            roomId: true,

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
            updatedAt:
              'desc',
          },

          take: 30,
        }),

        this.prisma.attachment.findMany({
          where: {
            kind:
              'DOCUMENT',

            entry: {
              room: {
                property: {
                  ownerId,
                },
              },
            },

            fileName: {
              contains: q,
              mode:
                'insensitive',
            },
          },

          select: {
            id: true,
            fileName: true,
            mimeType: true,
            size: true,
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
            createdAt:
              'desc',
          },

          take: 20,
        }),
      ]);

    return {
      query: q,
      properties,
      rooms,
      entries,
      documents,
    };
  }
}