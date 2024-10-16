import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { MangaController } from './manga.controller';
import { MangaService } from './manga.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MangaController],
  providers: [MangaService],
})
export class MangaModule {}
