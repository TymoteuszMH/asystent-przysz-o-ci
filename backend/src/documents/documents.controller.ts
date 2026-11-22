import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  DocumentsService,
  SimilarityCheckResult,
  ResponseModelResult,
} from './documents.service';
import { Document } from './document.interface';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CheckSimilarityDto } from './dto/check-similarity.dto';
import { GenerateResponseDto } from './dto/generate-response.dto';
import { ApproveResponseDto } from './dto/approve-response.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  /**
   * POST /documents/check-similarity
   * Analizuje zbieżność nowego wniosku z wnioskami z ostatniego roku
   * i rekomenduje wydziały urzędu do przygotowania odpowiedzi.
   */
  @Post('check-similarity')
  @HttpCode(HttpStatus.OK)
  checkSimilarity(
    @Body() checkSimilarityDto: CheckSimilarityDto,
  ): SimilarityCheckResult {
    return this.documentsService.checkSimilarity(checkSimilarityDto);
  }

  /**
   * POST /documents/reset
   * Resetuje listę dokumentów do 16 wzorcowych spraw UDIP
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  reset(): Document[] {
    return this.documentsService.reset();
  }

  /**
   * POST /documents/:id/generate-response
   * Na podstawie odpowiedzi z wydziału generuje model odpowiedzi urzędowej
   * oraz wykrywa wszelkie wrażliwe pola podlegające anonimizacji.
   */
  @Post(':id/generate-response')
  @HttpCode(HttpStatus.OK)
  generateResponse(
    @Param('id') id: string,
    @Body() generateResponseDto: GenerateResponseDto,
  ): ResponseModelResult {
    return this.documentsService.generateResponseModel(id, generateResponseDto);
  }

  /**
   * POST /documents/:id/approve-response
   * Zatwierdzenie odpowiedzi przez urzędnika i zapisanie wersji zanonimizowanej.
   */
  @Post(':id/approve-response')
  @HttpCode(HttpStatus.OK)
  approveResponse(
    @Param('id') id: string,
    @Body() approveResponseDto: ApproveResponseDto,
  ): Document {
    return this.documentsService.approveResponse(id, approveResponseDto);
  }

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

  /**
   * PATCH /documents/:id
   * Aktualizuje istniejący dokument (pola, status, wydziały, decyzja, sygnatura itp.)
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Document {
    return this.documentsService.update(id, updateDocumentDto);
  }

  // New endpoint for receiving statutes (ustawy)
  @Post('ustawy')
  @HttpCode(HttpStatus.CREATED)
  createUstawa(@Body() createDocumentDto: CreateDocumentDto): Document {
    // Reuse the existing document creation logic; you may extend this to store in a separate collection.
    return this.documentsService.create(createDocumentDto);
  }
}

