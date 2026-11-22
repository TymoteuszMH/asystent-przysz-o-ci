import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, map, throwError } from 'rxjs';
import {
  Document,
  CreateDocumentDto,
  CheckSimilarityDto,
  SimilarityCheckResult,
  GenerateResponseDto,
  ApproveResponseDto,
  ResponseModelResult,
  RequestAnalysis,
  RequestAnonymizationFields,
  AnonymizationSuggestion
} from '../models/document.model';

const MAX_DOCUMENT_FILE_MB = 25;

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly apiUrl = 'http://localhost:3000/documents';

  constructor(private http: HttpClient) {}

  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getDocumentById(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.apiUrl}/${encodeURIComponent(id)}`).pipe(
      catchError(this.handleError)
    );
  }

  createDocument(dto: CreateDocumentDto): Observable<Document> {
    return this.http.post<Document>(this.apiUrl, dto).pipe(
      catchError(this.handleError)
    );
  }

  checkSensitiveData(fields: RequestAnonymizationFields): Observable<AnonymizationSuggestion[]> {
    return this.http.post<AnonymizationSuggestion[]>(`${this.apiUrl}/check-sensitive-data`, fields).pipe(
      catchError(this.handleError)
    );
  }

  analyzeRequest(dto: CheckSimilarityDto): Observable<RequestAnalysis> {
    return this.http.post<RequestAnalysis>(`${this.apiUrl}/analyze`, dto).pipe(
      catchError(this.handleError)
    );
  }

  readDocumentFile(file: File): Promise<string> {
    if (file.size > MAX_DOCUMENT_FILE_MB * 1024 * 1024) {
      return Promise.reject(new Error(`Plik może mieć maksymalnie ${MAX_DOCUMENT_FILE_MB} MB.`));
    }
    const extension = /\.(pdf|docx|jpe?g|png)$/i.exec(file.name)?.[1]?.toLowerCase();
    if (extension) {
      const data = new FormData();
      data.append('file', file);
      const format = extension === 'pdf' || extension === 'docx' ? extension : 'image';
      return firstValueFrom(this.http.post<{ text: string }>(`${this.apiUrl}/extract-${format}`, data).pipe(
        map(result => result.text),
        catchError(this.handleError)
      ));
    }

    if (!/\.(txt|json)$/i.test(file.name)) {
      return Promise.reject(new Error('Wybierz plik TXT, JSON, DOCX, PDF, JPG lub PNG.'));
    }
    return file.text();
  }

  checkSimilarity(dto: CheckSimilarityDto): Observable<SimilarityCheckResult> {
    return this.http.post<SimilarityCheckResult>(`${this.apiUrl}/check-similarity`, dto).pipe(
      catchError(this.handleError)
    );
  }

  generateResponseModel(docId: string, dto: GenerateResponseDto): Observable<ResponseModelResult> {
    return this.http.post<ResponseModelResult>(`${this.apiUrl}/${encodeURIComponent(docId)}/generate-response`, dto).pipe(
      catchError(this.handleError)
    );
  }

  approveResponse(docId: string, dto: ApproveResponseDto): Observable<Document> {
    return this.http.post<Document>(`${this.apiUrl}/${encodeURIComponent(docId)}/approve-response`, dto).pipe(
      catchError(this.handleError)
    );
  }

  updateDocument(docId: string, dto: Partial<CreateDocumentDto>): Observable<Document> {
    return this.http.patch<Document>(`${this.apiUrl}/${encodeURIComponent(docId)}`, dto).pipe(
      catchError(this.handleError)
    );
  }

  resetDocuments(): Observable<Document[]> {
    return this.http.post<Document[]>(`${this.apiUrl}/reset`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Wystąpił nieoczekiwany błąd';
    if (error.error instanceof ErrorEvent) {
      message = `Błąd sieci lub klienta: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        message = 'Brak połączenia z serwerem NestJS (http://localhost:3000). Upewnij się, że backend jest uruchomiony.';
      } else if (error.status === 404) {
        message = 'Nie znaleziono żądanego zapytania (404).';
      } else if (error.status === 409) {
        message = 'Zapytanie o takim ID już istnieje (409).';
      } else {
        message = error.error?.message || `Błąd serwera (${error.status}): ${error.statusText}`;
      }
    }
    return throwError(() => new Error(message));
  }
}
