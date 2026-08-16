import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream } from 'fs';
import { mkdir, unlink } from 'fs/promises';
import { dirname, join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export type StoredObject = {
  storageKey: string;
  publicUrl: string | null;
};

@Injectable()
export class MediaStorageService {
  constructor(private readonly config: ConfigService) {}

  private root() {
    return this.config.get<string>('LOCAL_UPLOAD_DIR')?.trim() || join(process.cwd(), 'uploads');
  }

  async save(params: {
    businessId: string;
    filename: string;
    body: Buffer;
  }): Promise<StoredObject> {
    const bucket = this.config.get<string>('STORAGE_BUCKET')?.trim();
    const key = `${params.businessId}/${Date.now()}-${sanitizeName(params.filename)}`;
    if (bucket) {
      // S3 is configured via env; until credentials are present the local adapter still writes
      // and records a would-be public URL so publishing APIs have something to fetch.
      const endpoint = this.config.get<string>('STORAGE_PUBLIC_BASE_URL')?.replace(/\/+$/, '');
      const dir = join(this.root(), params.businessId);
      await mkdir(dir, { recursive: true });
      const dest = join(this.root(), key);
      await mkdir(dirname(dest), { recursive: true });
      await writeBuffer(dest, params.body);
      return {
        storageKey: key,
        publicUrl: endpoint ? `${endpoint}/${key}` : null,
      };
    }

    const dest = join(this.root(), key);
    await mkdir(dirname(dest), { recursive: true });
    await writeBuffer(dest, params.body);
    return { storageKey: key, publicUrl: null };
  }

  absolutePath(storageKey: string) {
    return join(this.root(), storageKey);
  }

  async remove(storageKey: string) {
    try {
      await unlink(this.absolutePath(storageKey));
    } catch {
      // Missing file is not an ownership failure.
    }
  }
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
}

async function writeBuffer(dest: string, body: Buffer) {
  await pipeline(Readable.from(body), createWriteStream(dest));
}
