import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaUploadStatus } from '@prisma/client';
import { createReadStream } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { MediaStorageService } from './media-storage.service';

const ALLOWED = new Set(['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png']);

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorageService,
    private readonly config: ConfigService,
  ) {}

  async upload(
    businessId: string,
    userId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    campaignId?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('A file is required.');
    }
    if (!ALLOWED.has(file.mimetype)) {
      throw new BadRequestException('Only MP4, MOV, JPG, and PNG are allowed.');
    }
    const max = Number(this.config.get('MEDIA_MAX_BYTES') ?? 100 * 1024 * 1024);
    if (file.size > max) {
      throw new BadRequestException(`File exceeds ${max} bytes.`);
    }
    if (campaignId) {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: campaignId, businessId },
      });
      if (!campaign) throw new NotFoundException('Campaign not found.');
    }

    const stored = await this.storage.save({
      businessId,
      filename: file.originalname,
      body: file.buffer,
    });

    const row = await this.prisma.campaignMedia.create({
      data: {
        businessId,
        campaignId: campaignId || null,
        uploadedByUserId: userId,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl,
        status: MediaUploadStatus.READY,
      },
    });
    return this.publicMedia(row);
  }

  async list(businessId: string, campaignId?: string) {
    const rows = await this.prisma.campaignMedia.findMany({
      where: { businessId, ...(campaignId ? { campaignId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return { data: rows.map((row) => this.publicMedia(row)) };
  }

  async getOwned(businessId: string, id: string) {
    const row = await this.prisma.campaignMedia.findFirst({ where: { id, businessId } });
    if (!row) throw new NotFoundException('Media not found.');
    return row;
  }

  async remove(businessId: string, id: string) {
    const row = await this.getOwned(businessId, id);
    await this.storage.remove(row.storageKey);
    await this.prisma.campaignMedia.delete({ where: { id: row.id } });
    return { deleted: true };
  }

  openStream(businessId: string, storageKey: string) {
    if (!storageKey.startsWith(`${businessId}/`)) {
      throw new ForbiddenException();
    }
    return createReadStream(this.storage.absolutePath(storageKey));
  }

  publicMedia(row: {
    id: string;
    campaignId: string | null;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    publicUrl: string | null;
    durationSeconds: number | null;
    status: MediaUploadStatus;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      campaignId: row.campaignId,
      filename: row.filename,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      publicUrl: row.publicUrl,
      durationSeconds: row.durationSeconds,
      status: row.status,
      createdAt: row.createdAt,
    };
  }
}
