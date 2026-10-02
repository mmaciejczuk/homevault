import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  PrismaModule,
} from '../prisma/prisma.module';

import {
  StorageModule,
} from '../storage/storage.module';

import {
  PropertiesController,
} from './properties.controller';

import {
  PropertiesService,
} from './properties.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StorageModule,
  ],

  controllers: [
    PropertiesController,
  ],

  providers: [
    PropertiesService,
  ],
})
export class PropertiesModule {}