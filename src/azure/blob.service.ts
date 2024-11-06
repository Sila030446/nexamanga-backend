import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class AzureService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor(private readonly configService: ConfigService) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      this.configService.getOrThrow<string>('AZURE_STORAGE_CONNECTION_STRING'),
    );
    this.containerName = this.configService.getOrThrow<string>(
      'AZURE_CONTAINER_NAME',
    );
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

      // Create a path for the file within the container
      const blobName = `${mangaTitle}/${chapterTitle}/${fileName}`;

      // Get a reference to the container client
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );

      // Upload the file as a block blob
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: response.headers['content-type'] },
      });

      // Generate and return the URL of the uploaded file
      const blobUrl = blockBlobClient.url;
      return blobUrl;
    } catch (error) {
      console.error('Error uploading image to Azure Blob Storage:', error);
      throw new InternalServerErrorException(
        'Failed to upload image to Azure Blob Storage',
      );
    }
  }
}
