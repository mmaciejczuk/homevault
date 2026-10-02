import {
  Module,
} from '@nestjs/common';

import {
  EntriesController,
} from './entries.controller';

import {
  EntriesService,
} from './entries.service';

import {
  PrismaModule,
} from '../prisma/prisma.module';

import {
  StorageModule,
} from '../storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
  ],

  controllers: [
    EntriesController,
  ],

  providers: [
    EntriesService,
  ],
})
export class EntriesModule {}