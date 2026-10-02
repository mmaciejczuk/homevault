import { Module } from '@nestjs/common';

import { AppController } from './app.controller';

import { AppService } from './app.service';

import { PropertiesModule } from './properties/properties.module';

import { RoomsModule } from './rooms/rooms.module';

import { EntriesModule } from './entries/entries.module';

import { AttachmentsModule } from './attachments/attachments.module';

import { AuthModule } from './auth/auth.module';

import { AccountModule } from './account/account.module';

import { SearchModule } from './search/search.module';

import { DevicesModule } from './devices/devices.module';

import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PropertiesModule,
    RoomsModule,
    EntriesModule,
    AttachmentsModule,
    AuthModule,
    AccountModule,
    SearchModule,
    DevicesModule,
    DashboardModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
