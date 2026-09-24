import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { CreateEntryDto } from './dto/create-entry.dto';
import { EntriesService } from './entries.service';

@Controller()
export class EntriesController {
  constructor(
    private readonly entriesService: EntriesService,
  ) {}

  @Get('rooms/:roomId/entries')
  findByRoom(
    @Param('roomId', ParseIntPipe)
    roomId: number,
  ) {
    return this.entriesService.findByRoom(roomId);
  }

  @Post('rooms/:roomId/entries')
  create(
    @Param('roomId', ParseIntPipe)
    roomId: number,

    @Body()
    dto: CreateEntryDto,
  ) {
    return this.entriesService.create(
      roomId,
      dto,
    );
  }

  @Get('entries/:id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.entriesService.findOne(id);
  }
}