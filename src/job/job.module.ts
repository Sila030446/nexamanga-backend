import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobProcessor } from './job.processor';
import { S3Module } from 'src/s3/s3.module';
import { UserModule } from 'src/user/user.module';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [
    TelegramModule,
    UserModule,
    S3Module,
    BullModule.registerQueue({
      name: 'jobsQueue',
    }),
  ],
  controllers: [JobController],
  providers: [JobService, JobProcessor], // เพิ่ม JobProcessor เข้าไปใน providers
})
export class JobModule {}
