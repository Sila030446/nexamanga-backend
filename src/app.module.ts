import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { makimaSearchModule } from './makimaSearch/makimaSearch.module';
import { JobModule } from './job/job.module';
import { DatabaseModule } from './database/database.module';
import { BullModule } from '@nestjs/bullmq';
import { AwsService } from './aws/aws.service';
import { AwsModule } from './aws/aws.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
<<<<<<< Updated upstream
=======
import { MangaModule } from './manga/manga.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BookmarkModule } from './bookmark/bookmark.module';
>>>>>>> Stashed changes

@Module({
  imports: [
    ScheduleModule.forRoot(),
<<<<<<< Updated upstream
    ConfigModule.forRoot(),
=======
    ConfigModule.forRoot({
      isGlobal: true,
    }),
>>>>>>> Stashed changes
    AwsModule,
    makimaSearchModule,
    JobModule,
    DatabaseModule,
<<<<<<< Updated upstream
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
=======
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          maxRetriesPerRequest: null,
>>>>>>> Stashed changes
        },
      },
    }),
    BullModule.registerQueue({
      name: 'jobsQueue',
    }),
<<<<<<< Updated upstream
=======
    MangaModule,
    AuthModule,
    UserModule,
    BookmarkModule,
>>>>>>> Stashed changes
  ],
  controllers: [AppController],
  providers: [AppService, AwsService],
})
export class AppModule {}
