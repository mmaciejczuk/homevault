import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
  CreatePropertyDto,
} from './dto/create-property.dto';

import {
  UpdatePropertyDto,
} from './dto/update-property.dto';

import {
  PropertiesService,
} from './properties.service';

@Controller('properties')
@UseGuards(SupabaseAuthGuard)
export class PropertiesController {
  constructor(
    private readonly propertiesService:
      PropertiesService,
  ) {}

  @Get()
  findAll(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.propertiesService.findAll(
      request.user.id,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.propertiesService.findOne(
      id,
      request.user.id,
    );
  }

  @Post()
  create(
    @Body()
    dto: CreatePropertyDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.propertiesService.create(
      dto,
      request.user.id,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdatePropertyDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.propertiesService.update(
      id,
      dto,
      request.user.id,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.propertiesService.remove(
      id,
      request.user.id,
    );
  }
}