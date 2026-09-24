import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PropertiesModule } from './properties/properties.module';
import { RoomsModule } from './rooms/rooms.module';
import { EntriesModule } from './entries/entries.module';
import { AttachmentsModule } from './attachments/attachments.module';

@Module({
  imports: [
    PropertiesModule,
    RoomsModule,
    EntriesModule,
    AttachmentsModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}