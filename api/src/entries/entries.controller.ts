import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SupabaseAuthGuard } from '../auth/auth.guard';

import type {
  AuthenticatedRequest,
} from '../auth/auth.guard';

import { CreateEntryDto } from './dto/create-entry.dto';
import { EntriesService } from './entries.service';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class EntriesController {
  constructor(
    private readonly entriesService: EntriesService,
  ) {}

  @Get('rooms/:roomId/entries')
  findByRoom(
    @Param('roomId', ParseIntPipe)
    roomId: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.entriesService.findByRoom(
      roomId,
      request.user.id,
    );
  }

  @Post('rooms/:roomId/entries')
  create(
    @Param('roomId', ParseIntPipe)
    roomId: number,

    @Body()
    dto: CreateEntryDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.entriesService.create(
      roomId,
      dto,
      request.user.id,
    );
  }

  @Get('entries/:id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.entriesService.findOne(
      id,
      request.user.id,
    );
  }
}