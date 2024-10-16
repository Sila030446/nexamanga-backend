import { Module } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { BookmarkController } from './bookmark.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DatabaseModule, UserModule],
  controllers: [BookmarkController],
  providers: [BookmarkService, JwtStrategy],
})
export class BookmarkModule {}
