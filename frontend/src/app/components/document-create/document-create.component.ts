import { Component, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RequestAnonymizationComponent } from '../request-anonymization/request-anonymization.component';
import { UdipStateService } from '../../services/udip-state.service';
import { DocumentService } from '../../services/document.service';
import {
  CreateDocumentDto,
  SimilarityCheckResult,
  DepartmentRecommendation,
  SimilarDocumentItem,
  RequestAnalysis,
  DepartmentRequestPlan,
  RequestAnonymizationFields
} from '../../models/document.model';

import { downloadDepartmentRequest } from '../../utils/department-request';

type ArchivedRequestPreview = Pick<SimilarDocumentItem,
  'id' | 'caseNumber' | 'title' | 'content' | 'applicant' | 'date' | 'department' | 'status' | 'archivedResponse' | 'isDuplicate'
>;

@Component({
  selector: 'app-document-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RequestAnonymizationComponent, RouterLink],
  templateUrl: './document-create.component.html',
  styleUrls: ['./document-create.component.css']
})
export class DocumentCreateComponent {
  @ViewChild(RequestAnonymizationComponent) anonymization?: RequestAnonymizationComponent;

  private readonly reviewedFields = signal<RequestAnonymizationFields | null>(null);
  readonly anonymizationReviewed = computed(() => {
    const fields = this.reviewedFields();
    return !!fields && fields.title === this.title() && fields.content === this.content() &&
      fields.applicant === this.author();
  });

  applyAnonymization(fields: RequestAnonymizationFields): void {
    const applicant = fields.applicant ?? '';
    const changed = fields.title !== this.title() || fields.content !== this.content() || applicant !== this.author();
    this.reviewedFields.set({ ...fields, applicant });
    if (!changed) return;
    this.title.set(fields.title);
    this.content.set(fields.content);
    this.author.set(applicant);
    this.requestAnalysis.set(null);
    this.analysisResult.set(null);
  }

  // Form fields
  numerSprawy = signal<string>('');
  title = signal<string>('');
  content = signal<string>('');
  author = signal<string>('');
  department = signal<string>('Biuro Komunikacji Społecznej');
  dataWplywu = signal<string>(new Date().toISOString().substring(0, 10));
  terminOdpowiedzi = signal<string>(this.calculateDefaultDeadline());
  osobaOdpowiedzialna = signal<string>('');
  status = signal<string>('nowy');
  tagsInput = signal<string>('informacja publiczna');

  // File upload state
  uploadedFileName = signal<string | null>(null);
  isDragOver = signal<boolean>(false);
  isReadingFile = signal(false);
  requestAnalysis = signal<RequestAnalysis | null>(null);
  isAnalyzingRequest = signal(false);
  requestAnalysisError = signal<string | null>(null);

  // Similarity & department analysis state
  isAnalyzing = signal<boolean>(false);
  analysisResult = signal<SimilarityCheckResult | null>(null);
  analysisError = signal<string | null>(null);
  targetDepartmentForRequest = signal<DepartmentRecommendation | null>(null);
  departmentRequestPlans = signal<DepartmentRequestPlan[]>([]);
  savedRequestInModal = signal<DepartmentRequestPlan | null>(null);
  requestInternalDeadline = signal<string>(this.calculateInternalDeadline());
  requestNotes = signal<string>('');
  previewModalDoc = signal<ArchivedRequestPreview | null>(null);
  archiveCaseNumber = signal('');
  archiveLookupError = signal<string | null>(null);
  isLookingUpArchive = signal(false);
  duplicateConfirmed = signal(false);

  // Form submission state
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private documentService: DocumentService,
    private udipState: UdipStateService,
    private router: Router
  ) {}

  private calculateDefaultDeadline(date = this.dataWplywu()): string {
    const d = new Date(date + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 14);
    return d.toISOString().substring(0, 10);
  }

  private calculateInternalDeadline(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7); // 7 dni dla wydziału merytorycznego
    return d.toISOString().substring(0, 10);
  }

  // --- Obsługa wgrywania plików ---
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  async processFile(file: File): Promise<void> {
    if (this.isReadingFile()) return;
    this.isReadingFile.set(true);
    this.analysisError.set(null);
    try {
      const text = await this.documentService.readDocumentFile(file);
      if (!text.trim()) throw new Error('Plik nie zawiera treści.');
      this.requestAnalysis.set(null);
      this.uploadedFileName.set(file.name);
      this.parseAndApplyFileContent(file.name, text);
    } catch (error) {
      this.analysisError.set(error instanceof Error ? error.message : 'Nie udało się odczytać pliku.');
    } finally {
      this.isReadingFile.set(false);
    }
  }

  analyzeRequest(): void {
    if (this.anonymization?.isReviewPending) return;
    const title = this.title().trim();
    const content = this.content().trim();
    if (!content || this.isAnalyzingRequest()) return;
    this.isAnalyzingRequest.set(true);
    this.requestAnalysis.set(null);
    this.requestAnalysisError.set(null);
    this.documentService.analyzeRequest({ title, content }).subscribe({
      next: result => {
        this.isAnalyzingRequest.set(false);
        if (title === this.title().trim() && content === this.content().trim()) {
          this.requestAnalysis.set(result);
        }
      },
      error: (error: Error) => {
        this.isAnalyzingRequest.set(false);
        this.requestAnalysisError.set(error.message);
      },
    });
  }

  applyRequestAnalysis(analysis: RequestAnalysis): void {
    if (analysis.title && !this.title().trim()) this.title.set(analysis.title);
    if (analysis.applicant && !this.author().trim()) this.author.set(analysis.applicant);
    if (analysis.keywords.length) {
      const existing = this.tagsInput().split(',').map(tag => tag.trim()).filter(Boolean);
      this.tagsInput.set([...new Set([...existing, ...analysis.keywords])].join(', '));
    }
    this.checkSimilarity();
  }

  updateReceiptDate(date: string): void {
    this.dataWplywu.set(date);
    this.terminOdpowiedzi.set(date ? this.calculateDefaultDeadline(date) : '');
  }

  parseAndApplyFileContent(fileName: string, text: string): void {
    let extractedTitle = '';
    let extractedContent = '';
    let extractedAuthor = '';
    let extractedTags: string[] = ['informacja publiczna'];

    // Jeśli plik to JSON
    if (fileName.toLowerCase().endsWith('.json')) {
      try {
        const json = JSON.parse(text);
        extractedTitle = [json.title, json.przedmiot].find(value => typeof value === 'string') || '';
        extractedContent = [json.content, json.tresc, json.opis].find(value => typeof value === 'string' && value.trim()) || text;
        extractedAuthor = [json.author, json.wnioskodawca].find(value => typeof value === 'string') || '';
        if (Array.isArray(json.tags)) {
          extractedTags = json.tags.filter((tag: unknown) => typeof tag === 'string');
        }
      } catch {
        extractedContent = text;
      }
    } else {
      const normalized = text.trim();
      const lineBreak = normalized.indexOf('\n');
      const firstLine = (lineBreak === -1 ? normalized : normalized.slice(0, lineBreak)).trim();
      extractedTitle = firstLine.length < 120 ? firstLine : firstLine.slice(0, 90) + '...';
      extractedContent = normalized;
    }

    if (!this.title() && extractedTitle) {
      this.title.set(extractedTitle);
    }
    this.content.set(extractedContent);
    if (extractedAuthor && !this.author()) {
      this.author.set(extractedAuthor);
    }
    if (extractedTags.length > 0) {
      this.tagsInput.set(extractedTags.join(', '));
    }

    // Automatyczne uruchomienie sprawdzenia zbieżności i wydziałów
    this.checkSimilarity();
  }

  // --- Analiza zbieżności i rekomendacja wydziałów ---
  checkSimilarity(): void {
    const contentVal = this.content().trim();
    if (!contentVal) {
      this.analysisError.set('Wprowadź lub wgraj treść wniosku, aby sprawdzić zbieżność.');
      return;
    }

    this.isAnalyzing.set(true);
    this.analysisError.set(null);

    const tags = this.tagsInput()
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    this.documentService
      .checkSimilarity({
        title: this.title().trim(),
        content: contentVal,
        tags: tags
      })
      .subscribe({
        next: (result) => {
          this.analysisResult.set(result);
          this.isAnalyzing.set(false);

          // Automatyczne zasugerowanie pierwszego wydziału, jeśli użytkownik nie zmienił ręcznie
          if (result.suggestedDepartments.length > 0 && result.suggestedDepartments[0].isPrimary) {
            const primaryDept = result.suggestedDepartments[0];
            this.department.set(primaryDept.name);
          }
        },
        error: (err: Error) => {
          this.isAnalyzing.set(false);
          this.analysisError.set(err.message);
        }
      });
  }

  chooseDepartment(dept: DepartmentRecommendation): void {
    this.department.set(dept.name);
  }

  openSendModal(dept: DepartmentRecommendation): void {
    this.savedRequestInModal.set(null);
    const saved = this.departmentRequestPlans().find(request => request.department === dept.name);
    this.requestInternalDeadline.set(saved?.deadline ?? this.calculateInternalDeadline());
    this.requestNotes.set(saved?.notes ?? 'Proszę o przygotowanie stanowiska merytorycznego do wskazanego terminu.');
    this.targetDepartmentForRequest.set(dept);
  }

  closeRequestModal(): void {
    this.targetDepartmentForRequest.set(null);
  }

  confirmDepartmentRequest(): void {
    const dept = this.targetDepartmentForRequest();
    const deadline = this.requestInternalDeadline();
    const notes = this.requestNotes().trim();
    if (!dept || !deadline || !notes) return;

    this.department.set(dept.name);
    const request: DepartmentRequestPlan = {
      department: dept.name,
      contactEmail: dept.contactEmail,
      deadline,
      notes,
      similarCases: this.analysisResult()?.similarDocuments.map(item => item.caseNumber),
    };
    this.departmentRequestPlans.update(plans => [
      ...plans.filter(plan => plan.department !== request.department),
      request,
    ]);
    this.savedRequestInModal.set(request);
  }

  downloadRequest(request: DepartmentRequestPlan): void {
    downloadDepartmentRequest(request, {
      subject: this.title().trim(),
      caseNumber: this.numerSprawy().trim(),
    });
  }

  findArchivedRequest(): void {
    const caseNumber = this.archiveCaseNumber().trim();
    if (!caseNumber || this.isLookingUpArchive()) return;

    this.archiveLookupError.set(null);
    this.isLookingUpArchive.set(true);
    this.documentService.getDocumentById(caseNumber).subscribe({
      next: doc => {
        this.isLookingUpArchive.set(false);
        this.openDocPreview({
          id: doc.id,
          caseNumber: doc.metadata.numerSprawy || doc.metadata.caseNumber || `Nr ${doc.id}`,
          title: doc.title,
          content: doc.content,
          applicant: doc.metadata.wnioskodawca || doc.metadata.applicant || doc.author,
          date: (doc.metadata.dataWplywu || doc.createdAt).substring(0, 10),
          department: doc.metadata.department,
          status: doc.metadata.status,
          archivedResponse: doc.metadata.wersjaAnonimizowana?.trim() || doc.metadata.odpowiedzZatwierdzona,
          isDuplicate: doc.metadata.decision === 'DUPLIKAT',
        });
      },
      error: (error: Error) => {
        this.isLookingUpArchive.set(false);
        this.archiveLookupError.set(error.message);
      },
    });
  }

  openDocPreview(doc: ArchivedRequestPreview): void {
    this.duplicateConfirmed.set(false);
    this.errorMessage.set(null);
    this.previewModalDoc.set(doc);
  }

  closeDocPreview(): void {
    if (this.isSubmitting()) return;
    this.previewModalDoc.set(null);
  }

  useSimilarDocDepartment(doc: ArchivedRequestPreview): void {
    if (doc.department) {
      this.department.set(doc.department);
    }
  }

  finishAsDuplicate(original: ArchivedRequestPreview): void {
    if (!this.duplicateConfirmed() || original.isDuplicate) return;
    this.onSubmit(original);
  }

  // --- Zapis wniosku do rejestru ---
  onSubmit(original?: ArchivedRequestPreview): void {
    if (this.isSubmitting() || this.isReadingFile()) return;
    const duplicateOfId = original?.id;
    const anonymizationReviewed = this.anonymizationReviewed() && !this.anonymization?.isReviewPending;
    if (!original?.archivedResponse?.trim() && !anonymizationReviewed) {
      this.errorMessage.set('Potwierdź przegląd anonimizacji przed zapisem wniosku.');
      return;
    }
    const titleVal = this.title().trim();
    const contentVal = this.content().trim();

    if (!titleVal) {
      this.errorMessage.set('Tytuł zapytania jest wymagany.');
      return;
    }
    if (!contentVal) {
      this.errorMessage.set('Treść zapytania jest wymagana.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const tags = this.tagsInput()
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const caseNumber = this.numerSprawy().trim();
    const applicant = this.author().trim() || 'Anonim';

    // Przygotowanie metadanych ze zbieżności i wydziału
    const similarDocIds = this.analysisResult()?.similarDocuments.map((d) => d.caseNumber) || [];
    const recommendedDepts = this.analysisResult()?.suggestedDepartments.map((d) => d.name) || [];

    const dto: CreateDocumentDto = {
      duplicateOfId,
      anonymizationReviewed,
      title: titleVal,
      content: contentVal,
      author: applicant,
      tags: tags,
      metadata: {
        numerSprawy: caseNumber || undefined,
        caseNumber: caseNumber || undefined,
        wnioskodawca: applicant,
        applicant: applicant,
        przedmiotZapytania: titleVal,
        dataWplywu: this.dataWplywu() || undefined,
        terminOdpowiedzi: this.terminOdpowiedzi() || undefined,
        osobaOdpowiedzialna: this.osobaOdpowiedzialna().trim() || undefined,
        department: this.department().trim() || undefined,
        status: this.status(),
        zbiezneWnioskiIds: similarDocIds.length > 0 ? similarDocIds : undefined,
        rekomendowaneWydzialy: recommendedDepts.length > 0 ? recommendedDepts : undefined,
        planyZapytanDoWydzialow: this.departmentRequestPlans()
      }
    };

    this.documentService.createDocument(dto).subscribe({
      next: (createdDoc) => {
        this.udipState.triggerReload();
        this.isSubmitting.set(false);
        if (duplicateOfId) {
          this.previewModalDoc.set(null);
          this.udipState.showToast('Zamknięto wniosek jako duplikat. Odpowiedź jest dostępna w karcie sprawy.');
          void this.router.navigate(['/documents', createdDoc.id]);
          return;
        }
        this.successMessage.set('Wniosek został pomyślnie zarejestrowany w systemie!');
        setTimeout(() => {
          this.router.navigate(['/documents', createdDoc.id]);
        }, 800);
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.message);
      }
    });
  }
}
