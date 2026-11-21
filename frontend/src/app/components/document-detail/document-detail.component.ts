import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DocumentService } from '../../services/document.service';
import {
  Document,
  ResponseModelResult,
  SensitiveField
} from '../../models/document.model';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.css']
})
export class DocumentDetailComponent implements OnInit {
  document = signal<Document | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Sekcja odpowiedzi z wydziału i anonimizacji
  departmentFeedback = signal<string>('');
  isGeneratingResponse = signal<boolean>(false);
  responseModel = signal<ResponseModelResult | null>(null);
  activeTab = signal<'highlighted' | 'anonymized'>('highlighted');
  daneAnonimizacji = signal<SensitiveField[]>([]);
  officerNote = signal<string>(
    'Odpowiedź zweryfikowana pod kątem RODO i zatwierdzona do publikacji w BIP (art. 5 ust. 2 UDIP).'
  );
  isApproving = signal<boolean>(false);
  approvalSuccessMessage = signal<string | null>(null);
  copiedToClipboard = signal<boolean>(false);
  customPhraseToAnonymize = signal<string>('');

  // Wyliczanie zanonimizowanego tekstu w czasie rzeczywistym wg zaznaczonych checkboxów
  liveAnonymizedText = computed(() => {
    const model = this.responseModel();
    if (!model) return '';

    let text = model.draftResponseText;
    const fields = this.daneAnonimizacji();

    for (const field of fields) {
      if (field.isAnonymized && field.value) {
        text = text.split(field.value).join(field.replacement);
      }
    }
    return text;
  });

  // Liczba aktywnych pól zanonimizowanych
  activeAnonymizedCount = computed(() => {
    return this.daneAnonimizacji().filter((f) => f.isAnonymized).length;
  });

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDocument(id);
    } else {
      this.errorMessage.set('Brak identyfikatora dokumentu.');
      this.isLoading.set(false);
    }
  }

  loadDocument(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.documentService.getDocumentById(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        this.isLoading.set(false);
        this.initExistingResponseData(doc);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  private initExistingResponseData(doc: Document): void {
    if (doc.metadata?.odpowiedzZatwierdzona) {
      const savedFields = (doc.metadata.dane_podlegajace_anonimizacji as SensitiveField[]) || [];
      this.daneAnonimizacji.set(savedFields);
      this.responseModel.set({
        caseNumber: this.getCaseNumber(doc),
        documentTitle: doc.title,
        applicant: this.getApplicant(doc),
        departmentName: (doc.metadata.department as string) || 'Wydział merytoryczny',
        draftResponseText: doc.metadata.odpowiedzZatwierdzona as string,
        dane_podlegajace_anonimizacji: savedFields,
        anonymizedPreviewText: (doc.metadata.wersjaAnonimizowana as string) || (doc.metadata.odpowiedzZatwierdzona as string),
        generatedAt: doc.metadata.dataOdpowiedzi?.toString() || doc.updatedAt
      });
    }
  }

  // --- Generowanie modelu odpowiedzi urzędowej ---
  generateResponse(): void {
    const doc = this.document();
    const feedback = this.departmentFeedback().trim();
    if (!doc) return;

    if (!feedback) {
      this.errorMessage.set('Wprowadź stanowisko/informacje otrzymane z wydziału.');
      return;
    }

    this.isGeneratingResponse.set(true);
    this.errorMessage.set(null);
    this.approvalSuccessMessage.set(null);

    const deptName = (doc.metadata?.department as string) || 'Wydział merytoryczny Urzędu Miasta';

    this.documentService
      .generateResponseModel(doc.id, {
        departmentFeedback: feedback,
        departmentName: deptName
      })
      .subscribe({
        next: (res) => {
          this.responseModel.set(res);
          this.daneAnonimizacji.set([...res.dane_podlegajace_anonimizacji]);
          this.isGeneratingResponse.set(false);
          this.activeTab.set('highlighted');
        },
        error: (err: Error) => {
          this.isGeneratingResponse.set(false);
          this.errorMessage.set(err.message);
        }
      });
  }

  // Wstawianie przykładowej odpowiedzi z wydziału dla demonstracji anonimizacji
  insertSampleFeedback(): void {
    const doc = this.document();
    const title = (doc?.title || '').toLowerCase();
    const applicant = this.getApplicant(doc || ({} as Document));

    let sample = '';
    if (title.includes('zwierz') || title.includes('odławi') || title.includes('pies')) {
      sample =
        `Wydział Zieleni i Gospodarki Komunalnej informuje, że w analizowanym okresie odłowiono 142 bezdomne zwierzęta. ` +
        `Sprawę prowadził inspektor Jan Kowalski (tel. 52 585 80 00, e-mail: jan.kowalski@poczta.onet.pl). ` +
        `Zgłoszenia interwencyjne od mieszkańców przyjmowano m.in. od wnioskodawcy ${applicant} oraz osoby zgłaszającej ` +
        `Pani Barbary Wiśniewskiej zamieszkałej przy ul. Toruńskiej 45/2 (PESEL: 86051412345, tel. 601 234 567). ` +
        `Wszystkie zwierzęta zostały zabezpieczone w schronisku miejskim zgodnie z umową.`;
    } else if (title.includes('szkoł') || title.includes('edukac') || title.includes('uczni')) {
      sample =
        `Wydział Edukacji i Sportu informuje, że w szkołach podstawowych uczy się łącznie 18 450 uczniów, w tym 890 uczniów cudzoziemców. ` +
        `Koordynatorem zestawienia jest inspektor Tomasz Lewandowski (e-mail: tomasz.lewandowski@interia.pl, tel. 52 585 91 00). ` +
        `Szczegółowe dane dotyczące wniosku ${applicant} przekazano do dyrekcji SP nr 12 przy ul. Kcyńskiej 8.`;
    } else {
      sample =
        `Wydział merytoryczny po analizie sprawy przekazuje następujące stanowisko: ` +
        `Wniosek złożony przez ${applicant} został rozpatrzony pozytywnie. ` +
        `Wszelkie czynności koordynował pracownik referatu Jan Kowalski (kontakt prywatny: j.kowalski@wp.pl, tel. 602 111 222). ` +
        `Dokumentacja dotycząca nieruchomości przy ul. Długiej 18/4 została udostępniona zgodnie z procedurą.`;
    }

    this.departmentFeedback.set(sample);
  }

  // Przełączanie anonimizacji pojedynczego pola
  toggleFieldAnonymization(field: SensitiveField): void {
    field.isAnonymized = !field.isAnonymized;
    // Wywołanie aktualizacji sygnału
    this.daneAnonimizacji.set([...this.daneAnonimizacji()]);
  }

  toggleAll(anonymize: boolean): void {
    const updated = this.daneAnonimizacji().map((f) => ({
      ...f,
      isAnonymized: anonymize
    }));
    this.daneAnonimizacji.set(updated);
  }

  // Dodawanie własnej frazy do anonimizacji
  addCustomSensitiveField(): void {
    const val = this.customPhraseToAnonymize().trim();
    if (!val) return;

    const newField: SensitiveField = {
      id: `custom_${Date.now()}`,
      category: 'inne',
      label: 'Wskazana dana wrażliwa',
      value: val,
      replacement: `[zanonimizowano - art. 5 ust. 2 UDIP]`,
      startIndex: 0,
      endIndex: val.length,
      isAnonymized: true,
      legalBasis: 'art. 5 ust. 2 ustawy o dostępie do informacji publicznej'
    };

    this.daneAnonimizacji.set([...this.daneAnonimizacji(), newField]);
    this.customPhraseToAnonymize.set('');
  }

  // --- Zatwierdzenie odpowiedzi urzędowej ---
  approveResponse(): void {
    const doc = this.document();
    const model = this.responseModel();
    if (!doc || !model) return;

    this.isApproving.set(true);
    this.errorMessage.set(null);

    const finalizedText = model.draftResponseText;
    const anonymizedText = this.liveAnonymizedText();

    this.documentService
      .approveResponse(doc.id, {
        finalResponseText: finalizedText,
        anonymizedText: anonymizedText,
        dane_podlegajace_anonimizacji: this.daneAnonimizacji(),
        officerNote: this.officerNote()
      })
      .subscribe({
        next: (updatedDoc) => {
          this.document.set(updatedDoc);
          this.isApproving.set(false);
          this.approvalSuccessMessage.set(
            'Odpowiedź została pomyślnie zatwierdzona! Status sprawy zmieniono na "odpowiedziano".'
          );
        },
        error: (err: Error) => {
          this.isApproving.set(false);
          this.errorMessage.set(err.message);
        }
      });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedToClipboard.set(true);
      setTimeout(() => this.copiedToClipboard.set(false), 2500);
    });
  }

  downloadAsText(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  getCaseNumber(doc: Document): string {
    return doc.metadata?.numerSprawy || doc.metadata?.caseNumber || doc.id;
  }

  getApplicant(doc: Document): string {
    return doc.metadata?.wnioskodawca || doc.metadata?.applicant || doc.author || 'Nie podano';
  }

  getStatusBadgeClass(status?: string): string {
    const s = (status || 'nowy').toLowerCase();
    if (s === 'odpowiedziano' || s === 'zrealizowane') return 'badge-success';
    if (s === 'w toku' || s === 'w trakcie') return 'badge-warning';
    if (s === 'przeterminowane') return 'badge-danger';
    return 'badge-info';
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'osoba': return 'cat-osoba';
      case 'email': return 'cat-email';
      case 'telefon': return 'cat-telefon';
      case 'adres': return 'cat-adres';
      case 'pesel': return 'cat-pesel';
      default: return 'cat-inne';
    }
  }

  getExtraMetadataEntries(metadata: Record<string, unknown>): [string, unknown][] {
    const standardKeys = new Set([
      'numerSprawy',
      'caseNumber',
      'wnioskodawca',
      'applicant',
      'przedmiotZapytania',
      'dataWplywu',
      'terminOdpowiedzi',
      'dataOdpowiedzi',
      'osobaOdpowiedzialna',
      'pozostaloDni',
      'department',
      'status',
      'odpowiedzZatwierdzona',
      'wersjaAnonimizowana',
      'dane_podlegajace_anonimizacji',
      'notatkaUrzednika'
    ]);

    return Object.entries(metadata).filter(([key]) => !standardKeys.has(key));
  }
}
