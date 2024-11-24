import { Test, TestingModule } from '@nestjs/testing';
import { SearchMangaService } from './search-manga.service';

describe('SearchMangaService', () => {
  let service: SearchMangaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchMangaService],
    }).compile();

    service = module.get<SearchMangaService>(SearchMangaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
