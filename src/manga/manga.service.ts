import { Injectable } from '@nestjs/common';
import { Chapter, MangaManhwa } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class MangaService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Retrieves a list of all mangas, including their associated chapters.
   *
   * @return {Promise<MangaManhwa[]>} A promise resolving to an array of manga data.
   */
  async getNewMangasChapterUpdate(
    page: number = 1,
    limit: number = 12,
  ): Promise<{ mangas: MangaManhwa[]; totalPages: number }> {
    // Step 1: Calculate how many mangas to skip for the current page
    const skip = (page - 1) * limit;

    // Step 2: Fetch the total number of mangas
    const totalMangas = await this.db.mangaManhwa.count();

    // Step 3: Fetch manga and include the latest chapter's updatedAt
    const mangasWithLatestUpdate = await this.db.mangaManhwa.findMany({
      include: {
        type: true,
        chapters: {
          orderBy: {
            updatedAt: 'desc', // Sort chapters to get the most recent one first
          },
          take: 1, // Get only the most recent chapter's updatedAt for sorting
        },
      },
    });

    // Step 4: Sort the mangas based on the latest chapter's updatedAt
    const sortedMangas = mangasWithLatestUpdate.sort((a, b) => {
      const latestChapterA = a.chapters[0]?.updatedAt || new Date(0); // Default to the oldest possible date if no chapter
      const latestChapterB = b.chapters[0]?.updatedAt || new Date(0);
      return latestChapterB.getTime() - latestChapterA.getTime();
    });

    // Step 5: Apply pagination after sorting
    const paginatedMangas = sortedMangas.slice(skip, skip + limit);

    // Step 6: Fetch the two most recent chapters for each manga separately
    const mangasWithTwoChapters = await Promise.all(
      paginatedMangas.map(async (manga) => {
        const mangaWithTwoChapters = await this.db.mangaManhwa.findUnique({
          where: { id: manga.id },
          include: {
            type: true,
            chapters: {
              orderBy: {
                chapterNumber: 'desc', // Order by chapter number
              },
              take: 2, // Get the 2 most recent chapters
            },
          },
        });
        return mangaWithTwoChapters;
      }),
    );

    // Step 7: Calculate the total number of pages
    const totalPages = Math.ceil(totalMangas / limit);

    // Step 8: Return the mangas and the total number of pages
    return { mangas: mangasWithTwoChapters, totalPages };
  }

  async getNewComicUpdateByType(
    page: number = 1,
    limit: number = 12,
    type: string,
  ): Promise<{ mangas: MangaManhwa[]; totalPages: number }> {
    // Step 1: Calculate how many mangas to skip for the current page
    const skip = (page - 1) * limit;

    // Step 2: Fetch the total number of mangas
    const totalMangas = await this.db.mangaManhwa.count({
      where: { type: { some: { name: type } } },
    });

    // Step 3: Fetch manga and include the latest chapter's updatedAt
    const mangasWithLatestUpdate = await this.db.mangaManhwa.findMany({
      where: { type: { some: { name: type } } },
      include: {
        type: true,
        chapters: {
          orderBy: {
            updatedAt: 'desc', // Sort chapters to get the most recent one first
          },
          take: 1, // Get only the most recent chapter's updatedAt for sorting
        },
      },
    });

    // Step 4: Sort the mangas based on the latest chapter's updatedAt
    const sortedMangas = mangasWithLatestUpdate.sort((a, b) => {
      const latestChapterA = a.chapters[0]?.updatedAt || new Date(0); // Default to the oldest possible date if no chapter
      const latestChapterB = b.chapters[0]?.updatedAt || new Date(0);
      return latestChapterB.getTime() - latestChapterA.getTime();
    });

    // Step 5: Apply pagination after sorting
    const paginatedMangas = sortedMangas.slice(skip, skip + limit);

    // Step 6: Fetch the two most recent chapters for each manga separately
    const mangasWithTwoChapters = await Promise.all(
      paginatedMangas.map(async (manga) => {
        const mangaWithTwoChapters = await this.db.mangaManhwa.findUnique({
          where: { id: manga.id },
          include: {
            type: true,
            chapters: {
              orderBy: {
                chapterNumber: 'desc', // Order by chapter number
              },
              take: 2, // Get the 2 most recent chapters
            },
          },
        });
        return mangaWithTwoChapters;
      }),
    );

    // Step 7: Calculate the total number of pages
    const totalPages = Math.ceil(totalMangas / limit);

    // Step 8: Return the mangas and the total number of pages
    return { mangas: mangasWithTwoChapters, totalPages };
  }

  async getManga(id: number) {
    try {
      const manga = await this.db.mangaManhwa.findUnique({
        where: { id },
        include: {
          type: true,
          authors: true,
          genres: true,
          ratings: true,
          comments: true,
          chapters: {
            orderBy: {
              chapterNumber: 'desc',
            },
          },
        },
      });

      if (!manga) {
        return null;
      }

      const ratingsCount = manga.ratings.length;
      const avgRating =
        ratingsCount > 0
          ? manga.ratings.reduce((sum, rating) => sum + rating.score, 0) /
            ratingsCount
          : 0;

      // Update view count
      await this.db.mangaManhwa.update({
        where: { id },
        data: {
          viewCount: manga.viewCount + 1,
        },
      });

      return {
        ...manga,
        avgRating,
      };
    } catch (error) {
      console.error('Error fetching manga:', error);
      return null;
    }
  }

  async getChapterPages(slug: string): Promise<{
    currentChapter: Chapter | null;
    previousSlug: string | null;
    nextSlug: string | null;
    allChapters: { slug: string; title: string }[];
  }> {
    const currentChapter = await this.db.chapter.findUnique({
      where: { slug },
      include: {
        mangaManhwa: {
          select: {
            id: true,
            title: true,
          },
        },
        pages: {
          orderBy: {
            pageNumber: 'asc',
          },
        },
      },
    });

    if (!currentChapter) {
      return {
        currentChapter: null,
        previousSlug: null,
        nextSlug: null,
        allChapters: [],
      };
    }

    const previousChapter = await this.getAdjacentChapter(
      currentChapter.mangaManhwaId,
      currentChapter.id,
      'lt',
    );
    const nextChapter = await this.getAdjacentChapter(
      currentChapter.mangaManhwaId,
      currentChapter.id,
      'gt',
    );

    const allChapters = await this.db.chapter.findMany({
      where: { mangaManhwaId: currentChapter.mangaManhwaId },
      select: {
        slug: true,
        title: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return {
      currentChapter,
      previousSlug: previousChapter?.slug || null,
      nextSlug: nextChapter?.slug || null,
      allChapters,
    };
  }

  private async getAdjacentChapter(
    mangaId: number,
    chapterId: number,
    operator: 'lt' | 'gt',
  ) {
    return this.db.chapter.findFirst({
      where: {
        mangaManhwaId: mangaId,
        id: {
          [operator]: chapterId,
        },
      },
      orderBy: {
        id: operator === 'lt' ? 'desc' : 'asc',
      },
      select: {
        slug: true,
      },
    });
  }

  async getPopularMangas(): Promise<MangaManhwa[]> {
    const popularMangas = await this.db.mangaManhwa.findMany({
      include: {
        ratings: true,
        type: true,
        genres: true,
        authors: true,
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 5,
    });

    return popularMangas.map((manga) => {
      const ratingsCount = manga.ratings.length;
      const avgRating =
        ratingsCount > 0
          ? manga.ratings.reduce((sum, rating) => sum + rating.score, 0) /
            ratingsCount
          : 0;

      return {
        ...manga,
        avgRating: Math.min(Math.max(avgRating, 0), 10),
      };
    });
  }

  async getAllGenres() {
    const genres = await this.db.genre.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    return genres;
  }
}
