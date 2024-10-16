import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class BookmarkService {
  constructor(private readonly prisma: DatabaseService) {}

  async addBookmark(userId: string, mangaManhwaId: number) {
    const manga = await this.prisma.mangaManhwa.findUnique({
      where: { id: mangaManhwaId },
    });

    if (!manga) {
      throw new NotFoundException('Manga not found');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!mangaManhwaId) {
      throw new Error('Manga Manhwa ID is required');
    }

    const existingBookmark = await this.prisma.bookmarks.findFirst({
      where: {
        userId,
        mangaManhwaId,
      },
    });

    if (existingBookmark) {
      throw new ConflictException('You have already bookmarked this manga');
    }

    try {
      return this.prisma.bookmarks.create({
        data: {
          userId,
          mangaManhwaId,
        },
      });
    } catch (error) {
      console.error('Error while creating bookmark:', error);
      throw error;
    }
  }

  async getBookmarks(userId: string) {
    return this.prisma.bookmarks.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        mangaManhwa: {
          include: {
            chapters: {
              orderBy: { chapterNumber: 'desc' },
              take: 2, // Fetching only the top 2 latest chapters
            },
            type: true, // Including the 'type' relationship
          },
        },
      },
    });
  }

  async removeBookmark(userId: string, mangaManhwaId: number) {
    await this.prisma.bookmarks.deleteMany({
      where: {
        userId,
        mangaManhwaId,
      },
    });
    return { success: true };
  }
}
