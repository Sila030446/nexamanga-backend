import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { MangaController } from './manga.controller';
import { MangaService } from './manga.service';
import { SearchMangaModule } from './search-manga/search-manga.module';

@Module({
  imports: [DatabaseModule, SearchMangaModule],
  controllers: [MangaController],
  providers: [MangaService],
  exports: [MangaService],
})
export class MangaModule {}
