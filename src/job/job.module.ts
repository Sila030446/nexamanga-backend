import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobProcessor } from './job.processor';
import { BlobModule } from 'src/azure/blob.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    UserModule,
    BlobModule,
    BullModule.registerQueue({
      name: 'jobsQueue',
    }),
  ],
  controllers: [JobController],
  providers: [JobService, JobProcessor], // เพิ่ม JobProcessor เข้าไปใน providers
})
export class JobModule {}
