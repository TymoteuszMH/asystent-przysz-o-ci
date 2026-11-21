import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document } from './document.interface';
import { CreateDocumentDto } from './dto/create-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * GET /documents
   * Zwraca listę wszystkich dokumentów
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(): Document[] {
    return this.documentsService.findAll();
  }

  /**
   * GET /documents/:id
   * Zwraca pojedynczy dokument po ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id') id: string): Document {
    return this.documentsService.findById(id);
  }

  /**
   * POST /documents
   * Tworzy i zwraca nowy dokument
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDocumentDto: CreateDocumentDto): Document {
    return this.documentsService.create(createDocumentDto);
  }
}
