import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SupabaseAuthGuard } from './auth.guard';

import type {
  AuthenticatedRequest,
} from './auth.guard';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getMe(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return {
      id: request.user.id,
      email: request.user.email,
    };
  }
}