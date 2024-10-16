import {
  Controller,
  Param,
  Post,
  Get,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from '@prisma/client';

@Controller('bookmark')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post(':mangaManhwaId')
  addBookmark(
    @Param('mangaManhwaId') mangaManhwaId: number,
    @CurrentUser() user: User,
  ) {
    return this.bookmarkService.addBookmark(user.id, +mangaManhwaId);
  }

  @Get()
  getBookmarks(@CurrentUser() user: User) {
    return this.bookmarkService.getBookmarks(user.id);
  }

  @Delete(':mangaManhwaId')
  removeBookmark(
    @Param('mangaManhwaId') mangaManhwaId: number,
    @CurrentUser() user: User,
  ) {
    return this.bookmarkService.removeBookmark(user.id, +mangaManhwaId);
  }
}
