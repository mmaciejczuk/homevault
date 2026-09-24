import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { AttachmentsService } from './attachments.service';

@Controller()
export class AttachmentsController {
  constructor(
    private readonly attachmentsService:
      AttachmentsService,
  ) {}

  @Get('entries/:entryId/attachments')
  findByEntry(
    @Param('entryId', ParseIntPipe)
    entryId: number,
  ) {
    return this.attachmentsService.findByEntry(
      entryId,
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
  ) {
    return this.attachmentsService.upload(
      entryId,
      file,
    );
  }

  @Delete('attachments/:id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.attachmentsService.remove(id);
  }
}