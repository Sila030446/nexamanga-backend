import { Module } from '@nestjs/common';
import { AzureService } from './blob.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [AzureService],
  exports: [AzureService], // ทำให้ AwsService ใช้งานได้ในโมดูลอื่น
})
export class BlobModule {}
