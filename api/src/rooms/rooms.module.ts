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
  RoomsController,
} from './rooms.controller';

import {
  RoomsService,
} from './rooms.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StorageModule,
  ],

  controllers: [
    RoomsController,
  ],

  providers: [
    RoomsService,
  ],
})
export class RoomsModule {}