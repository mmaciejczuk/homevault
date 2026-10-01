import {
  Module,
} from '@nestjs/common';

import {
  AuthController,
} from './auth.controller';

import {
  SupabaseAuthGuard,
} from './auth.guard';

import {
  AuthService,
} from './auth.service';

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
    AuthController,
  ],

  providers: [
    SupabaseAuthGuard,
    AuthService,
  ],

  exports: [
    SupabaseAuthGuard,
  ],
})
export class AuthModule {}