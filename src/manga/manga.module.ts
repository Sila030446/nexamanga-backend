import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { MangaController } from './manga.controller';
import { MangaService } from './manga.service';
import { SearchModule } from './search/search.module';

@Module({
  imports: [DatabaseModule, SearchModule],
  controllers: [MangaController],
  providers: [MangaService],
})
export class MangaModule {}
