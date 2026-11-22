import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { OnlineModelService } from './online-model.service';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, OnlineModelService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
