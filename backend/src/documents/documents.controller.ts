import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  DocumentsService,
  SimilarityCheckResult,
  ResponseModelResult,
} from './documents.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { OnlineModelService, RequestAnalysis } from './online-model.service';
import { Document } from './document.interface';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CheckSensitiveDataDto } from './dto/check-sensitive-data.dto';
import { CheckSimilarityDto } from './dto/check-similarity.dto';
import { GenerateResponseDto } from './dto/generate-response.dto';
import { ApproveResponseDto } from './dto/approve-response.dto';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly onlineModel: OnlineModelService,
  ) {}

  @Post('check-sensitive-data')
  @HttpCode(HttpStatus.OK)
  checkSensitiveData(@Body() dto: CheckSensitiveDataDto): { value: string; label: string }[] {
    const applicant = dto.applicant?.trim();
    const suggestions = new Map<string, string>();
    if (applicant && applicant !== 'Anonim' && applicant !== '[zanonimizowano]') {
      suggestions.set(applicant, 'Dane wnioskodawcy');
    }
    for (const text of [dto.title, dto.content]) {
      for (const { value, label } of this.documentsService.detectSensitiveData(text, applicant)) {
        if (!suggestions.has(value)) suggestions.set(value, label);
      }
    }
    return Array.from(suggestions, ([value, label]) => ({ value, label }));
  }

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  analyze(@Body() dto: CheckSimilarityDto): Promise<RequestAnalysis> {
    return this.onlineModel.analyzeRequest(dto);
  }

  @Post('extract-pdf')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async extractPdf(@UploadedFile() file?: { buffer: Buffer }): Promise<{ text: string }> {
    if (file?.buffer?.subarray(0, 5).toString() !== '%PDF-') {
      throw new BadRequestException('Wybierz poprawny plik PDF.');
    }

    const directory = await mkdtemp(join(tmpdir(), 'govflow-pdf-'));
    try {
      const path = join(directory, 'request.pdf');
      await writeFile(path, file.buffer, { mode: 0o600 });
      const { stdout } = await promisify(execFile)('pdftotext', ['-enc', 'UTF-8', path, '-'], {
        timeout: 10_000,
        maxBuffer: 64_000,
      });
      const text = stdout.trim();
      if (!text) {
        throw new BadRequestException('PDF nie zawiera warstwy tekstowej. Wklej treść albo użyj pliku po OCR.');
      }
      return { text };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Nie można odczytać PDF. Sprawdź plik oraz dostępność programu pdftotext.');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

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
  async generateResponse(
    @Param('id') id: string,
    @Body() generateResponseDto: GenerateResponseDto,
  ): Promise<ResponseModelResult> {
    const document = this.documentsService.findById(id);
    const applicant = (document.metadata.wnioskodawca || document.metadata.applicant || document.author) as string;
    const passages = [document.title, document.content, generateResponseDto.departmentFeedback];
    const detected = passages.flatMap(text => this.documentsService.detectSensitiveData(text, applicant));
    const masks = [...new Set(detected.map(field => field.value))]
      .sort((first, second) => second.length - first.length);
    const maskIds = new Map(masks.map((value, index) => [value, index]));
    const escapedMasks = masks.map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const maskPattern = new RegExp(['\\[DANE_\\d+\\]', ...escapedMasks].join('|'), 'g');
    const redact = (text: string) => text.replace(maskPattern, value => {
      const index = maskIds.get(value);
      return index === undefined ? '[dane]' : `[DANE_${index}]`;
    });
    const [title, request, feedback] = passages.map(redact);
    const response = await this.onlineModel.draftResponse(title, request, feedback);
    const restored = response.replace(/\[DANE_(\d+)\]/g, (marker, index) => masks[Number(index)] ?? marker);
    return this.documentsService.generateResponseModel(id, generateResponseDto, restored);
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

