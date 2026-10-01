import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  AuthService,
} from './auth.service';

import {
  SupabaseAuthGuard,
} from './auth.guard';

import type {
  AuthenticatedRequest,
} from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:
      AuthService,
  ) {}

  @Get('me')
  @UseGuards(
    SupabaseAuthGuard,
  )
  getMe(
    @Req()
    request:
      AuthenticatedRequest,
  ) {
    return {
      id:
        request.user.id,

      email:
        request.user.email,
    };
  }

  @Delete('account')
  @UseGuards(
    SupabaseAuthGuard,
  )
  @HttpCode(
    HttpStatus.NO_CONTENT,
  )
  async deleteAccount(
    @Req()
    request:
      AuthenticatedRequest,
  ) {
    await this.authService
      .deleteAccount(
        request.user.id,
      );
  }
}