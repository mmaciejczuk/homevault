import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './auth.guard';

@Module({
  controllers: [
    AuthController,
  ],
  providers: [
    SupabaseAuthGuard,
  ],
  exports: [
    SupabaseAuthGuard,
  ],
})
export class AuthModule {}