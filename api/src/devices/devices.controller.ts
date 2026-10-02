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

import { SupabaseAuthGuard } from '../auth/auth.guard';

import type { AuthenticatedRequest } from '../auth/auth.guard';

import { CreateDeviceDto } from './dto/create-device.dto';

import { UpdateDeviceDto } from './dto/update-device.dto';

import { CreateServiceRecordDto } from './dto/create-service-record.dto';

import { UpdateServiceRecordDto } from './dto/update-service-record.dto';

import { DevicesService } from './devices.service';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('entries/:entryId/device')
  findByEntry(
    @Param('entryId', ParseIntPipe)
    entryId: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.devicesService.findByEntry(entryId, request.user.id);
  }

  @Post('entries/:entryId/device')
  create(
    @Param('entryId', ParseIntPipe)
    entryId: number,

    @Body()
    dto: CreateDeviceDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.devicesService.create(entryId, dto, request.user.id);
  }

  @Patch('devices/:id')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateDeviceDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.devicesService.update(id, dto, request.user.id);
  }

  @Delete('devices/:id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.devicesService.remove(id, request.user.id);
  }

  @Get('devices/:deviceId/service-records')
  findServiceRecords(
    @Param('deviceId', ParseIntPipe)
    deviceId: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.devicesService.findServiceRecords(deviceId, request.user.id);
  }

  @Post('devices/:deviceId/service-records')
  createServiceRecord(
    @Param('deviceId', ParseIntPipe)
    deviceId: number,

    @Body()
    dto: CreateServiceRecordDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.devicesService.createServiceRecord(
      deviceId,
      dto,
      request.user.id,
    );
  }

  @Patch('service-records/:id')
  updateServiceRecord(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateServiceRecordDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.devicesService.updateServiceRecord(id, dto, request.user.id);
  }

  @Delete('service-records/:id')
  removeServiceRecord(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.devicesService.removeServiceRecord(id, request.user.id);
  }
}
