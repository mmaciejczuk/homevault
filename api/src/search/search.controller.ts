import {
  Controller,
  Get,
  Query,
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
  SearchService,
} from './search.service';

@Controller('search')
@UseGuards(
  SupabaseAuthGuard,
)
export class SearchController {
  constructor(
    private readonly searchService:
      SearchService,
  ) {}

  @Get()
  search(
    @Query('q')
    query = '',

    @Req()
    request:
      AuthenticatedRequest,
  ) {
    return this.searchService.search(
      query,
      request.user.id,
    );
  }
}