import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { MangaService } from './manga.service';
import { MangaManhwa, Chapter } from '@prisma/client';

@Controller('manga')
export class MangaController {
  constructor(private readonly mangaService: MangaService) {}

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
    @Query('page', ParseIntPipe) page: number = 1, // Default value of 1 if not provided
    @Query('limit', ParseIntPipe) limit: number = 12, // Default value of 12 if not provided
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
  async getManga(@Param('id') id: string): Promise<MangaManhwa | null> {
    const mangaId = parseInt(id, 10); // Convert string id to number
    return this.mangaService.getManga(mangaId);
  }

  @Get('pages/:slug')
  async getChapterPages(@Param('slug') slug: string): Promise<{
    currentChapter: Chapter | null;
    previousSlug: string | null;
    nextSlug: string | null;
    allChapters: { slug: string; title: string }[]; // Adjust this type based on your data structure
  }> {
    const { currentChapter, previousSlug, nextSlug, allChapters } =
      await this.mangaService.getChapterPages(slug);

    // Handle the case where the current chapter is not found
    if (!currentChapter) {
      throw new NotFoundException('Chapter not found');
    }

    return { currentChapter, previousSlug, nextSlug, allChapters };
  }
}
