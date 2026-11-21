import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import {
  Document,
  CreateDocumentDto,
  CheckSimilarityDto,
  SimilarityCheckResult,
  GenerateResponseDto,
  ApproveResponseDto,
  ResponseModelResult
} from '../models/document.model';

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
