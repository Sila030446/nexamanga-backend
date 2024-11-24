import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SearchMangaService } from './search-manga.service';

@Injectable()
export class IndexingService implements OnModuleInit {
  logger = new Logger(IndexingService.name);
  constructor(private readonly mangaManhwaService: SearchMangaService) {}

  async onModuleInit() {
    this.logger.log('Indexing all MangaManhwa data...');
    await this.mangaManhwaService.indexAllMangaManhwa();
  }
}
