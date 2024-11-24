import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Chapter,
  MangaManhwa,
  Prisma,
  Rating,
  Types,
  Genre,
  Author,
  Comment,
  Page,
} from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

// Define interface for pagination parameters
interface PaginationParams {
  page?: number;
  limit?: number;
}

// Define interfaces for Prisma return types including relations
interface MangaWithChapters extends MangaManhwa {
  chapters: Chapter[];
  type: Types[];
}

interface MangaWithLatestChapter extends MangaManhwa {
  chapters: Chapter[];
  type: Types[];
}

interface MangaWithFullDetails extends MangaManhwa {
  type: Types[];
  authors: Author[];
  genres: Genre[];
  ratings: Rating[];
  comments: Comment[];
  chapters: Chapter[];
  avgRating?: number;
}

interface ChapterWithDetails extends Chapter {
  mangaManhwa: {
    id: number;
    title: string;
  };
  pages: Page[];
}

interface ChapterResponse {
  currentChapter: ChapterWithDetails | null;
  previousSlug: string | null;
  nextSlug: string | null;
  allChapters: Array<{ slug: string; title: string }>;
}

@Injectable()
export class MangaService {
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 12;
  private readonly DEFAULT_CHAPTERS_TO_INCLUDE = 2;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Retrieves paginated manga list with recent chapter updates
   */
  async getNewMangasChapterUpdate({
    page = this.DEFAULT_PAGE,
    limit = this.DEFAULT_LIMIT,
  }: PaginationParams = {}): Promise<{
    mangas: MangaWithChapters[];
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [totalMangas, mangasWithLatestUpdate] = await Promise.all([
      this.databaseService.mangaManhwa.count(),
      this.fetchMangasWithLatestChapter(),
    ]);

    const sortedAndPaginatedMangas = this.sortAndPaginateMangasByChapterDate(
      mangasWithLatestUpdate,
      skip,
      limit,
    );

    const mangasWithChapters = await this.fetchDetailedMangaData(
      sortedAndPaginatedMangas,
    );

    return {
      mangas: mangasWithChapters,
      totalPages: Math.ceil(totalMangas / limit),
    };
  }

  /**
   * Retrieves paginated manga list by type with recent chapter updates
   */
  async getNewComicUpdateByType(
    type: string,
    {
      page = this.DEFAULT_PAGE,
      limit = this.DEFAULT_LIMIT,
    }: PaginationParams = {},
  ): Promise<{ mangas: MangaWithChapters[]; totalPages: number }> {
    const typeFilter = { type: { some: { name: type } } };
    const skip = (page - 1) * limit;

    const [totalMangas, mangasWithLatestUpdate] = await Promise.all([
      this.databaseService.mangaManhwa.count({ where: typeFilter }),
      this.fetchMangasWithLatestChapter(typeFilter),
    ]);

    const sortedAndPaginatedMangas = this.sortAndPaginateMangasByChapterDate(
      mangasWithLatestUpdate,
      skip,
      limit,
    );

    const mangasWithChapters = await this.fetchDetailedMangaData(
      sortedAndPaginatedMangas,
    );

    return {
      mangas: mangasWithChapters,
      totalPages: Math.ceil(totalMangas / limit),
    };
  }

  async getNewMangasUpdateByGenre(
    genre: string,
    {
      page = this.DEFAULT_PAGE,
      limit = this.DEFAULT_LIMIT,
    }: PaginationParams = {},
  ): Promise<{ mangas: MangaWithChapters[]; totalPages: number }> {
    const genreFilter = { genres: { some: { name: genre } } };
    const skip = (page - 1) * limit;

    const [totalMangas, mangasWithLatestUpdate] = await Promise.all([
      this.databaseService.mangaManhwa.count({ where: genreFilter }),
      this.fetchMangasWithLatestChapter(genreFilter),
    ]);

    const sortedAndPaginatedMangas = this.sortAndPaginateMangasByChapterDate(
      mangasWithLatestUpdate,
      skip,
      limit,
    );

    const mangasWithChapters = await this.fetchDetailedMangaData(
      sortedAndPaginatedMangas,
    );

    return {
      mangas: mangasWithChapters,
      totalPages: Math.ceil(totalMangas / limit),
    };
  }

  /**
   * Retrieves detailed manga information by ID
   */
  async getManga(id: number): Promise<MangaWithFullDetails | null> {
    try {
      if (!id)
        throw new BadRequestException({
          message: 'Manga ID is required',
        });
      const manga = await this.databaseService.mangaManhwa.findUnique({
        where: { id },
        include: {
          type: true,
          authors: true,
          genres: true,
          ratings: true,
          comments: true,
          chapters: {
            orderBy: { chapterNumber: 'desc' },
          },
        },
      });

      if (!manga) {
        throw new NotFoundException(`Manga with ID ${id} not found`);
      }

      await this.incrementViewCount(id);

      return {
        ...manga,
        avgRating: this.calculateAverageRating(manga.ratings),
      };
    } catch (error) {
      console.error('Error fetching manga:', error);
      throw error;
    }
  }

  /**
   * Retrieves chapter pages with navigation information
   */
  async getChapterPages(slug: string): Promise<ChapterResponse> {
    const currentChapter = await this.databaseService.chapter.findUnique({
      where: { slug },
      include: {
        mangaManhwa: {
          select: { id: true, title: true },
        },
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
      },
    });

    if (!currentChapter) {
      return this.getEmptyChapterResponse();
    }

    const [previousChapter, nextChapter, allChapters] = await Promise.all([
      this.getAdjacentChapter(
        currentChapter.mangaManhwaId,
        currentChapter.id,
        'lt',
      ),
      this.getAdjacentChapter(
        currentChapter.mangaManhwaId,
        currentChapter.id,
        'gt',
      ),
      this.getAllChapters(currentChapter.mangaManhwaId),
    ]);

    return {
      currentChapter,
      previousSlug: previousChapter?.slug ?? null,
      nextSlug: nextChapter?.slug ?? null,
      allChapters,
    };
  }

  /**
   * Retrieves popular manga list with ratings
   */
  async getPopularMangas(): Promise<MangaWithFullDetails[]> {
    const popularMangas = await this.databaseService.mangaManhwa.findMany({
      include: {
        ratings: true,
        type: true,
        genres: true,
        authors: true,
        comments: true,
        chapters: true,
      },
      orderBy: { viewCount: 'desc' },
      take: 5,
    });

    return popularMangas.map((manga) => ({
      ...manga,
      avgRating: this.normalizeRating(
        this.calculateAverageRating(manga.ratings),
      ),
    }));
  }

  /**
   * Retrieves all available genres
   */
  async getAllGenres() {
    return this.databaseService.genre.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }

  async getAllMangasId() {
    return await this.databaseService.mangaManhwa.findMany({
      select: { id: true },
    });
  }

  async getAllChapterSlugs() {
    return await this.databaseService.chapter.findMany({
      select: { slug: true },
    });
  }

  // Private helper methods
  private async fetchMangasWithLatestChapter(
    where: Prisma.MangaManhwaWhereInput = {},
  ): Promise<MangaWithLatestChapter[]> {
    return this.databaseService.mangaManhwa.findMany({
      where,
      include: {
        type: true,
        chapters: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  private sortAndPaginateMangasByChapterDate(
    mangas: MangaWithLatestChapter[],
    skip: number,
    limit: number,
  ): MangaWithLatestChapter[] {
    return mangas
      .sort((a, b) => {
        const dateA = a.chapters[0]?.updatedAt ?? new Date(0);
        const dateB = b.chapters[0]?.updatedAt ?? new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(skip, skip + limit);
  }

  private async fetchDetailedMangaData(
    mangas: MangaWithLatestChapter[],
  ): Promise<MangaWithChapters[]> {
    return Promise.all(
      mangas.map((manga) =>
        this.databaseService.mangaManhwa.findUnique({
          where: { id: manga.id },
          include: {
            type: true,
            chapters: {
              orderBy: { chapterNumber: 'desc' },
              take: this.DEFAULT_CHAPTERS_TO_INCLUDE,
            },
          },
        }),
      ),
    );
  }

  private async incrementViewCount(id: number): Promise<void> {
    await this.databaseService.mangaManhwa.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  calculateAverageRating(ratings: Rating[]): number {
    if (!ratings.length) return 0;
    return (
      ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length
    );
  }

  normalizeRating(rating: number): number {
    return Math.min(Math.max(rating, 0), 10);
  }

  private async getAdjacentChapter(
    mangaId: number,
    chapterId: number,
    operator: 'lt' | 'gt',
  ) {
    return this.databaseService.chapter.findFirst({
      where: {
        mangaManhwaId: mangaId,
        id: { [operator]: chapterId },
      },
      orderBy: { id: operator === 'lt' ? 'desc' : 'asc' },
      select: { slug: true },
    });
  }

  private async getAllChapters(mangaId: number) {
    return this.databaseService.chapter.findMany({
      where: { mangaManhwaId: mangaId },
      select: { slug: true, title: true },
      orderBy: { id: 'asc' },
    });
  }

  private getEmptyChapterResponse(): ChapterResponse {
    return {
      currentChapter: null,
      previousSlug: null,
      nextSlug: null,
      allChapters: [],
    };
  }
}
