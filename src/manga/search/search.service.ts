import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { MangaManhwa } from '@prisma/client';
import { MANGA_INDEX } from './manga.index';

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async indexManga(manga: MangaManhwa) {
    return this.elasticsearchService.index({
      index: MANGA_INDEX,
      id: manga.id.toString(),
      document: {
        id: manga.id,
        title: manga.title,
        alternativeTitle: manga.alternativeTitle,
        description: manga.description,
      },
    });
  }

  async search(query: string) {
    const { hits } = await this.elasticsearchService.search({
      index: MANGA_INDEX,
      body: {
        query: {
          multi_match: {
            query,
            fields: ['title^3', 'alternativeTitle^2', 'description'],
            fuzziness: 'AUTO',
          },
        },
      },
    });
    return hits.hits.map((hit) => hit._source);
  }

  async suggest(query: string) {
    return this.elasticsearchService.search({
      index: MANGA_INDEX,
      body: {
        suggest: {
          titles: {
            prefix: query,
            completion: {
              field: 'title.completion',
              fuzzy: {
                fuzziness: 2,
              },
            },
          },
        },
      },
    });
  }
}
