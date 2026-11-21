import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DocumentService } from '../../services/document.service';
import {
  CreateDocumentDto,
  SimilarityCheckResult,
  DepartmentRecommendation,
  SimilarDocumentItem
} from '../../models/document.model';

@Component({
  selector: 'app-document-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './document-create.component.html',
  styleUrls: ['./document-create.component.css']
})
export class DocumentCreateComponent {
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

  // Similarity & department analysis state
  isAnalyzing = signal<boolean>(false);
  analysisResult = signal<SimilarityCheckResult | null>(null);
  analysisError = signal<string | null>(null);
  targetDepartmentForRequest = signal<DepartmentRecommendation | null>(null);
  requestSentNotice = signal<string | null>(null);
  requestInternalDeadline = signal<string>(this.calculateInternalDeadline());
  requestNotes = signal<string>('');
  previewModalDoc = signal<SimilarDocumentItem | null>(null);

  // Form submission state
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private documentService: DocumentService,
    private router: Router
  ) {}

  private calculateDefaultDeadline(): string {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14 dni ustawowe
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

  processFile(file: File): void {
    this.uploadedFileName.set(file.name);
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;
      this.parseAndApplyFileContent(file.name, text);
    };

    reader.onerror = () => {
      this.analysisError.set('Nie udało się odczytać wybranego pliku.');
    };

    reader.readAsText(file);
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
        extractedTitle = json.title || json.przedmiot || '';
        extractedContent = json.content || json.tresc || json.opis || text;
        extractedAuthor = json.author || json.wnioskodawca || '';
        if (json.tags && Array.isArray(json.tags)) {
          extractedTags = json.tags;
        }
      } catch {
        extractedContent = text;
      }
    } else {
      // Dla plików .txt, .doc, .pdf z tekstem
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length > 0) {
        // Pierwsza linia jako domyślny tytuł (jeśli w miarę krótka)
        if (lines[0].length < 120) {
          extractedTitle = lines[0];
          extractedContent = lines.slice(1).join('\n') || lines[0];
        } else {
          extractedTitle = lines[0].substring(0, 90) + '...';
          extractedContent = text;
        }
      } else {
        extractedContent = text;
      }
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

            // Przygotowanie wstępnej notatki dla wydziału
            if (result.similarDocuments.length > 0) {
              const sim = result.similarDocuments[0];
              this.requestNotes.set(
                `Proszę o przygotowanie projektu odpowiedzi. Zauważono zbieżność (${sim.similarityPercentage}%) ze sprawą ${sim.caseNumber} z dnia ${sim.date}.`
              );
            } else {
              this.requestNotes.set(
                `Proszę o przygotowanie projektu odpowiedzi i stanowiska merytorycznego do dnia ${this.requestInternalDeadline()}.`
              );
            }
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
    this.targetDepartmentForRequest.set(dept);
  }

  cancelSendModal(): void {
    this.targetDepartmentForRequest.set(null);
  }

  confirmSendRequest(): void {
    const dept = this.targetDepartmentForRequest();
    if (!dept) return;

    this.department.set(dept.name);
    this.requestSentNotice.set(
      `Wysłano oficjalną prośbę o przygotowanie odpowiedzi do: ${dept.name} (${dept.contactEmail}) z terminem wewnętrznym do ${this.requestInternalDeadline()}.`
    );
    this.targetDepartmentForRequest.set(null);
  }

  openDocPreview(doc: SimilarDocumentItem): void {
    this.previewModalDoc.set(doc);
  }

  closeDocPreview(): void {
    this.previewModalDoc.set(null);
  }

  useSimilarDocDepartment(doc: SimilarDocumentItem): void {
    if (doc.department) {
      this.department.set(doc.department);
    }
  }

  // --- Zapis wniosku do rejestru ---
  onSubmit(): void {
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
      title: titleVal,
      content: contentVal,
      author: applicant,
      tags: tags,
      metadata: {
        numerSprawy: caseNumber || undefined,
        caseNumber: caseNumber || undefined,
        wnioskodawca: applicant,
        applicant: applicant,
        przedmiotZapytania: contentVal,
        dataWplywu: this.dataWplywu() || undefined,
        terminOdpowiedzi: this.terminOdpowiedzi() || undefined,
        osobaOdpowiedzialna: this.osobaOdpowiedzialna().trim() || undefined,
        department: this.department().trim() || undefined,
        status: this.status(),
        zbiezneWnioskiIds: similarDocIds.length > 0 ? similarDocIds : undefined,
        rekomendowaneWydzialy: recommendedDepts.length > 0 ? recommendedDepts : undefined,
        prosbaWyslanaDo: this.requestSentNotice() ? [this.department()] : undefined
      }
    };

    this.documentService.createDocument(dto).subscribe({
      next: (createdDoc) => {
        this.isSubmitting.set(false);
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
