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

import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
  ) {}

  @Get('properties/:propertyId/rooms')
  findByProperty(
    @Param('propertyId', ParseIntPipe)
    propertyId: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.roomsService.findByProperty(
      propertyId,
      request.user.id,
    );
  }

  @Post('properties/:propertyId/rooms')
  create(
    @Param('propertyId', ParseIntPipe)
    propertyId: number,

    @Body()
    dto: CreateRoomDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.roomsService.create(
      propertyId,
      dto,
      request.user.id,
    );
  }

  @Get('rooms/:id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.roomsService.findOne(
      id,
      request.user.id,
    );
  }
}