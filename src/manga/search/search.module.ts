import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { SyncElasticsearch } from './sync-elasticsearch';

@Module({
  imports: [
    ElasticsearchModule.register({
      node: 'http://192.168.1.111:9200',
    }),
  ],
  providers: [SearchService, SyncElasticsearch],
  exports: [SearchService, SyncElasticsearch],
})
export class SearchModule {}
