import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { makimaSearchModule } from './makimaSearch/makimaSearch.module';
import { JobModule } from './job/job.module';
import { DatabaseModule } from './database/database.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { MangaModule } from './manga/manga.module';
import { MailerModule } from './mailer/mailer.module';
import { MailsModule } from './mails/mails.module';
import { BlobModule } from './azure/blob.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BlobModule,
    makimaSearchModule,
    JobModule,
    DatabaseModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          maxRetriesPerRequest: null,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'jobsQueue',
    }),
    MangaModule,
    AuthModule,
    UserModule,
    BookmarkModule,
    MailerModule,
    MailsModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
