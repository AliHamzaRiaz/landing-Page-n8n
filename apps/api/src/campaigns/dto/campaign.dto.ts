import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CampaignPostingType, SocialPlatform } from '@prisma/client';

export class CreateCampaignDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  platforms?: SocialPlatform[];
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class ConfirmCampaignDto {
  @IsEnum(CampaignPostingType)
  postingType!: CampaignPostingType;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(SocialPlatform, { each: true })
  platforms!: SocialPlatform[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  captions?: Record<string, { caption?: string; hashtags?: string }>;
}
