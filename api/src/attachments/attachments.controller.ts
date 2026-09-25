import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { SupabaseAuthGuard } from '../auth/auth.guard';

import type {
  AuthenticatedRequest,
} from '../auth/auth.guard';

import { AttachmentsService } from './attachments.service';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class AttachmentsController {
  constructor(
    private readonly attachmentsService:
      AttachmentsService,
  ) {}

  @Get('entries/:entryId/attachments')
  findByEntry(
    @Param('entryId', ParseIntPipe)
    entryId: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.attachmentsService.findByEntry(
      entryId,
      request.user.id,
    );
  }

  @Post('entries/:entryId/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  upload(
    @Param('entryId', ParseIntPipe)
    entryId: number,

    @UploadedFile()
    file: Express.Multer.File,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.attachmentsService.upload(
      entryId,
      file,
      request.user.id,
    );
  }

  @Delete('attachments/:id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.attachmentsService.remove(
      id,
      request.user.id,
    );
  }
}