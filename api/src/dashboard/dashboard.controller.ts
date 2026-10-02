import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { SupabaseAuthGuard } from '../auth/auth.guard';

import type { AuthenticatedRequest } from '../auth/auth.guard';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(SupabaseAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('attention')
  getAttention(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.dashboardService.getAttention(request.user.id);
  }
}
