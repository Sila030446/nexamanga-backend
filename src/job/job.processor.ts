import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import puppeteer, { Browser } from 'puppeteer';
import { DatabaseService } from 'src/database/database.service';
import {
  startMakimaScraping,
  scrapeChapterImages,
} from 'src/scraping/makima-scraping';
import { AzureService } from 'src/azure/blob.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { startGoMangaScraping } from 'src/scraping/gomanga-scraping';
import { startReaperTransScraping } from 'src/scraping/reapertrans-scraping';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
@Processor('jobsQueue')
export class JobProcessor extends WorkerHost {
  constructor(
    private readonly sendMessage: TelegramService,
    private readonly databaseService: DatabaseService,
    private readonly azureService: AzureService,
  ) {
    super();
  }

  @Cron(CronExpression.EVERY_DAY_AT_5PM)
  async handleScheduledJob() {
    console.log('Checking for updates...');
    await this.sendMessage.sendMessage('Checking for updates...');

    const jobs = await this.databaseService.job.findMany({
      where: { status: 'complete' },
    });

    for (const job of jobs) {
      await this.updateJobStatus(job.id, false, 'updated');
      console.log(`Processing job for URL: ${job.url}`);
      await this.sendMessage.sendMessage(`Processing job for URL: ${job.url}`);

      await this.processJob(job);

      await this.updateJobStatus(job.id, true, 'complete');
    }
  }

  private async updateJobStatus(
    id: number,
    isComplete: boolean,
    status: string,
  ) {
    await this.databaseService.job.update({
      where: { id },
      data: { isComplete, status },
    });
  }

  private async processJob(jobData: { id: number; url: string; jobType: any }) {
    const job: Job<any> = { data: jobData } as Job<any>;
    await this.process(job);
  }

  async process(job: Job<any>): Promise<void> {
    if (!job.data.url || !job.data.jobType)
      throw new Error('Invalid job data: URL or jobType is missing');

    const browser = await this.launchBrowser();
    let manga;

    try {
      manga = await this.scrapeManga(job, browser);

      if (!manga) throw new Error('Failed to scrape manga data');

      const existingManga = await this.databaseService.mangaManhwa.findUnique({
        where: { slug: manga.titleSlug },
        include: { chapters: true },
      });

      if (existingManga) {
        await this.processExistingManga(manga, existingManga, browser);
      } else {
        await this.processNewManga(manga, browser);
      }

      await this.updateJobStatus(job.data.id, true, 'complete');
      await this.sendMessage.sendMessage(
        `Job completed: ${manga.title} - total ${manga.chapters.length} chapters`,
      );
    } catch (error) {
      console.error('Error occurred:', error.message);
      await this.handleJobError(job.data.id, error.message);
    } finally {
      await this.closeBrowser(browser);
    }
  }

  private async launchBrowser(): Promise<Browser> {
    return puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }

  private async scrapeManga(job: Job<any>, browser: Browser) {
    const page = await browser.newPage();
    let manga;

    switch (job.data.jobType?.type) {
      case 'makima':
        console.log('Navigating to Makimaaaaaaa.com URL:', job.data.url);
        await page.goto(job.data.url, { timeout: 0 });
        manga = await startMakimaScraping(page, job.data.url);
        break;
      case 'go-manga':
        console.log('Navigating to Go-Manga.com URL:', job.data.url);
        manga = await startGoMangaScraping(page, job.data.url);
        break;
      case 'reapertrans':
        console.log('Navigating to Reapertrans.com URL:', job.data.url);
        manga = await startReaperTransScraping(page, job.data.url);
        break;
      default:
        throw new Error(`Unknown job type: ${job.data.jobType?.type}`);
    }

    return manga;
  }

  private async processExistingManga(manga, existingManga, browser: Browser) {
    await this.sendMessage.sendMessage(`Manga ${manga.title} already exists.`);
    console.log('Manga already exists');

    const newChapters = this.getNewChapters(existingManga, manga);
    console.log(`Found ${newChapters.length} new chapters`);

    await this.sendMessage.sendMessage(
      `Found ${newChapters.length} new chapters`,
    );

    if (newChapters.length > 0) {
      for (const [index, newChapter] of newChapters.reverse().entries()) {
        const createdChapter = await this.saveChapter(
          existingManga.id,
          newChapter,
          index,
          existingManga.chapters.length,
        );
        await this.uploadChapterImages(
          createdChapter.slug,
          newChapter.url,
          manga.title,
          newChapter.title,
          browser,
        );
      }
    } else {
      console.log('No new chapters found.');
      await this.sendMessage.sendMessage(
        `No new chapters found for ${manga.title}.`,
      );
    }
  }

  private async processNewManga(manga, browser: Browser) {
    console.log('New manga, saving...');

    const coverImageUrl = await this.azureService.uploadImageFromUrl(
      manga.coverImageUrl,
      manga.title,
      'cover',
    );
    const reversedChapters = manga.chapters.reverse();

    const savedManga = await this.databaseService.mangaManhwa.create({
      data: {
        title: manga.title,
        alternativeTitle: manga.alternativeTitle,
        slug: manga.titleSlug,
        description: manga.description,
        coverImageUrl: coverImageUrl,
        serialization: manga.serialization,
        releaseDate: new Date(),
        authors: {
          connectOrCreate: manga.authors.map((author) =>
            this.toCreateConnectData(author),
          ),
        },
        genres: {
          connectOrCreate: manga.genres.map((genre) =>
            this.toCreateConnectData(genre),
          ),
        },
        type: {
          connectOrCreate: manga.type.map((type) =>
            this.toCreateConnectData(type),
          ),
        },
        chapters: {
          create: reversedChapters.map((chapter, index) =>
            this.createChapterData(chapter, manga.titleSlug, index + 1),
          ),
        },
      },
      include: { chapters: true },
    });

    console.log('Manga saved:', savedManga);
    await this.sendMessage.sendMessage(`New manga saved: ${savedManga.title}`);

    for (const chapter of savedManga.chapters) {
      await this.uploadChapterImages(
        chapter.slug,
        chapter.urlScrape,
        manga.title,
        chapter.title,
        browser,
      );
    }
  }

  private async uploadChapterImages(
    slug,
    url,
    title,
    chapterTitle,
    browser: Browser,
  ) {
    console.log(`Fetching images for chapter: ${slug}`);
    const page = await browser.newPage();
    const imageUrls = await scrapeChapterImages(page, url);

    await Promise.all(
      imageUrls.map(async (imageUrl, pageNumber) => {
        try {
          const uploadedImageUrl = await this.azureService.uploadImageFromUrl(
            imageUrl,
            title,
            chapterTitle || `page-${pageNumber + 1}`,
          );
          await this.databaseService.page.create({
            data: {
              imageUrl: uploadedImageUrl,
              pageNumber: pageNumber + 1,
              chapter: { connect: { slug } },
            },
          });
          console.log(
            `Image saved to Blob Storage and DB: ${uploadedImageUrl}`,
          );
        } catch (error) {
          console.error(
            `Failed to upload image to Blob Storage: ${error.message}`,
          );
        }
      }),
    );
    await page.close();
  }

  private async handleJobError(id: number, message: string) {
    await this.sendMessage.sendMessage(`Error processing job: ${message}`);
    await this.updateJobStatus(id, true, 'failed');
  }

  private async closeBrowser(browser: Browser) {
    if (browser) {
      await browser.close();
      await this.sendMessage.sendMessage('Browser closed.');
      console.log('Browser closed.');
    }
  }

  private toCreateConnectData(entity) {
    return {
      where: { slug: entity.slug },
      create: { name: entity.name, slug: entity.slug },
    };
  }

  private createChapterData(chapter, titleSlug, chapterNumber: number) {
    return {
      chapterNumber,
      title: chapter.title || '',
      slug: `${titleSlug}${chapter.slug}`,
      urlScrape: chapter.url,
    };
  }

  private getNewChapters(existingManga, manga) {
    const existingChapterSlugs = new Set(
      existingManga.chapters.map((chapter) => chapter.slug),
    );
    return manga.chapters.filter(
      (chapter) =>
        !existingChapterSlugs.has(`${manga.titleSlug}${chapter.slug}`),
    );
  }

  private async saveChapter(
    mangaId: number,
    chapter,
    index: number,
    existingChapterCount: number,
  ) {
    return this.databaseService.chapter.create({
      data: {
        chapterNumber: existingChapterCount + index + 1,
        title: chapter.title || '',
        slug: `${mangaId}${chapter.slug}`,
        urlScrape: chapter.url,
        mangaManhwa: { connect: { id: mangaId } },
      },
    });
  }
}
