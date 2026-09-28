import {
  Controller,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  SupabaseAuthGuard,
} from '../auth/auth.guard';

import type {
  AuthenticatedRequest,
} from '../auth/auth.guard';

import {
  AccountService,
} from './account.service';

@Controller('account')
@UseGuards(SupabaseAuthGuard)
export class AccountController {
  constructor(
    private readonly accountService:
      AccountService,
  ) {}

  @Delete()
  async deleteAccount(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.accountService
      .deleteAccount(
        request.user.id,
      );
  }
}