import { Injectable } from '@nestjs/common';
import { SearchService } from './search.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class SyncElasticsearch {
  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: DatabaseService,
  ) {}

  async sync() {
    const mangas = await this.prisma.mangaManhwa.findMany({});
    for (const manga of mangas) {
      this.searchService.indexManga(manga);
    }
    console.log(`Indexed ${mangas.length} manga/manhwa documents`);
  }
}
