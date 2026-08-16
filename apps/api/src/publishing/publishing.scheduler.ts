import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PublishingProcessor } from './publishing.processor';

@Injectable()
export class PublishingScheduler implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly processor: PublishingProcessor) {}

  onModuleInit() {
    this.processor.start();
  }

  onModuleDestroy() {
    this.processor.stop();
  }
}
