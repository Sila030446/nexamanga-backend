import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchMangaService } from './search-manga.service';
import { IndexingService } from './indexing.service';
import { MangaService } from '../manga.service';

@Module({
  imports: [
    ConfigModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE'),
      }),
    }),
  ],
  providers: [SearchMangaService, IndexingService, MangaService],
  exports: [SearchMangaService],
})
export class SearchMangaModule {}
