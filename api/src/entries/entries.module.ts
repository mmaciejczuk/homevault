import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],

  controllers: [
    EntriesController,
  ],

  providers: [
    EntriesService,
  ],
})
export class EntriesModule {}