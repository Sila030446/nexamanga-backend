import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseIntPipe,
  Query,
  Post,
} from '@nestjs/common';
import { MangaService } from './manga.service';
import { MangaManhwa, Chapter } from '@prisma/client';
import { SearchMangaService } from './search-manga/search-manga.service';

@Controller('manga')
export class MangaController {
  constructor(
    private readonly mangaService: MangaService,
    private readonly searchQuery: SearchMangaService,
  ) {}

  // @Get('search')
  // async search(@Query('q') query: string) {
  //   return this.searchQuery.searchManga(query);
  // }

  // @Post('index/all')
  // async indexAllMangaManhwa() {
  //   await this.searchQuery.indexAllMangaManhwa();
  // }

  @Get('popular')
  async getPopularMangas(): Promise<MangaManhwa[]> {
    return this.mangaService.getPopularMangas();
  }

  @Get('all-mangas')
  async getAllMangasIds() {
    return this.mangaService.getAllMangasId();
  }

  @Get('all-chapters-slug')
  async getAllChapterSlugs() {
    return this.mangaService.getAllChapterSlugs();
  }

  @Get('genres')
  async getAllGenres() {
    return this.mangaService.getAllGenres();
  }

  @Get('genre/:genre')
  async getAllManhwasByGenre(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 12,
    @Param('genre') genre: string,
  ): Promise<{ mangas: MangaManhwa[]; totalPages: number }> {
    return this.mangaService.getNewMangasUpdateByGenre(genre, { page, limit });
  }

  @Get('update')
  async getAllMangas(
    @Query('page', ParseIntPipe) page: number = 1, // Default value of 1 if not provided
    @Query('limit', ParseIntPipe) limit: number = 12, // Default value of 12 if not provided
  ): Promise<{ mangas: MangaManhwa[]; totalPages: number }> {
    // Call the service method for fetching mangas with pagination
    return this.mangaService.getNewMangasChapterUpdate({ page, limit });
  }

  @Get('update/:type')
  async getAllManhwas(
    @Query('page', ParseIntPipe) page: number = 1, // Default value of 1 if not provided
    @Query('limit', ParseIntPipe) limit: number = 12, // Default value of 12 if not provided
    @Param('type') type: string,
  ): Promise<{ mangas: MangaManhwa[]; totalPages: number }> {
    // Call the service method for fetching mangas with pagination
    return this.mangaService.getNewComicUpdateByType(type, { page, limit });
  }

  @Get(':id')
  async getManga(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MangaManhwa | null> {
    return this.mangaService.getManga(id);
  }

  @Get('pages/:slug')
  async getChapterPages(@Param('slug') slug: string): Promise<{
    currentChapter: Chapter | null;
    previousSlug: string | null;
    nextSlug: string | null;
    allChapters: { slug: string; title: string }[]; // Adjust this type based on your data structure
  }> {
    const decodeSlug = encodeURIComponent(slug);
    const { currentChapter, previousSlug, nextSlug, allChapters } =
      await this.mangaService.getChapterPages(decodeSlug);

    // Handle the case where the current chapter is not found
    if (!currentChapter) {
      throw new NotFoundException('Chapter not found');
    }

    return { currentChapter, previousSlug, nextSlug, allChapters };
  }
}
