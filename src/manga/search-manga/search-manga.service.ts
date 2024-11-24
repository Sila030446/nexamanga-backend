import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchMangaService {
  private readonly logger = new Logger(SearchMangaService.name);
  constructor(
    private readonly prisma: DatabaseService,
    private readonly esService: ElasticsearchService,
  ) {}

  async indexAllMangaManhwa() {
    this.logger.log('Indexing all MangaManhwa data...');
    const mangaList = await this.prisma.mangaManhwa.findMany({
      include: { genres: true, authors: true, type: true },
    });

    for (const manga of mangaList) {
      await this.esService.index({
        index: 'manga-manhwa',
        id: manga.id.toString(),
        document: {
          title: manga.title,
          alternativeTitle: manga.alternativeTitle,
          slug: manga.slug,
          description: manga.description,
          genres: manga.genres.map((g) => g.name),
          authors: manga.authors.map((a) => a.name),
          types: manga.type.map((t) => t.name),
          releaseDate: manga.releaseDate,
          status: manga.status,
          viewCount: manga.viewCount,
        },
      });
    }
    this.logger.log('All MangaManhwa data indexed.');
  }

  async searchManga(query: string) {
    const { hits } = await this.esService.search({
      index: 'manga-manhwa',
      query: {
        multi_match: {
          query,
          fields: [
            'title^2',
            'alternativeTitle^1',
            'description',
            'genres',
            'authors',
          ],
        },
      },
    });

    return hits.hits.map((hit) => hit._source);
  }
}
