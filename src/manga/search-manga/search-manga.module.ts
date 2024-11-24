import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchMangaService } from './search-manga.service';
import { IndexingService } from './indexing.service';

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
  providers: [SearchMangaService, IndexingService],
  exports: [SearchMangaService],
})
export class SearchMangaModule {}
