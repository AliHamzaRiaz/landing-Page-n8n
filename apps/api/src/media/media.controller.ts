import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  list(
    @CurrentBusiness() businessId: string,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.media.list(businessId, campaignId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }))
  upload(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Query('campaignId') campaignId?: string,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('A file is required.');
    }
    return this.media.upload(businessId, user.sub, file, campaignId);
  }

  @Get(':id')
  async getOne(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    const row = await this.media.getOwned(businessId, id);
    return this.media.publicMedia(row);
  }

  @Get(':id/file')
  async file(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    const row = await this.media.getOwned(businessId, id);
    return new StreamableFile(this.media.openStream(businessId, row.storageKey), {
      type: row.mimeType,
      disposition: `inline; filename="${row.filename}"`,
    });
  }

  @Delete(':id')
  remove(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    return this.media.remove(businessId, id);
  }
}
