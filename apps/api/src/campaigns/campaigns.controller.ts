import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { MediaService } from '../media/media.service';
import { CampaignsService } from './campaigns.service';
import { ConfirmCampaignDto, CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaigns: CampaignsService,
    private readonly media: MediaService,
  ) {}

  @Get()
  async list(@CurrentBusiness() businessId: string) {
    return { data: await this.campaigns.list(businessId) };
  }

  @Post()
  create(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaigns.create(businessId, user.sub, dto);
  }

  @Get(':id')
  get(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    return this.campaigns.get(businessId, id);
  }

  @Patch(':id')
  @Put(':id')
  update(
    @CurrentBusiness() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaigns.update(businessId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    return this.campaigns.remove(businessId, id);
  }

  @Post(':id/media')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }))
  uploadMedia(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('A file is required.');
    }
    return this.media.upload(businessId, user.sub, file, id);
  }

  @Post(':id/generate-content')
  generate(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    return this.campaigns.generateContent(businessId, id);
  }

  @Post(':id/confirm')
  confirm(
    @CurrentBusiness() businessId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmCampaignDto,
  ) {
    return this.campaigns.confirm(businessId, id, dto);
  }
}
