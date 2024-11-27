import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class S3Service {
  private s3: S3;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.getOrThrow('AWS_REGION'),
    });
    this.bucketName = this.configService.getOrThrow('AWS_BUCKET_NAME');
  }

  async uploadImageFromUrl(
    imageUrl: string,
    mangaTitle: string,
    chapterTitle: string,
  ): Promise<string> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      const buffer = Buffer.from(response.data, 'binary');

      // Generate a unique file name
      const fileName = `${uuidv4()}.jpg`;

      // Create a path for the file within the bucket
      const key = `${mangaTitle}/${chapterTitle}/${fileName}`;

      // Upload the file to S3
      const uploadResult = await this.s3
        .upload({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: response.headers['content-type'],
        })
        .promise();

      // Return the URL of the uploaded file
      return uploadResult.Location;
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new InternalServerErrorException('Failed to upload image to S3');
    }
  }
}
