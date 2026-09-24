import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';

@Controller()
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
  ) {}

  @Get('properties/:propertyId/rooms')
  findByProperty(
    @Param('propertyId', ParseIntPipe)
    propertyId: number,
  ) {
    return this.roomsService.findByProperty(propertyId);
  }

  @Post('properties/:propertyId/rooms')
  create(
    @Param('propertyId', ParseIntPipe)
    propertyId: number,

    @Body()
    dto: CreateRoomDto,
  ) {
    return this.roomsService.create(
      propertyId,
      dto,
    );
  }

  @Get('rooms/:id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.roomsService.findOne(id);
  }
}