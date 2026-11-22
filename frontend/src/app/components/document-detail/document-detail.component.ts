import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocumentService } from '../../services/document.service';
import { UdipStateService } from '../../services/udip-state.service';
import {
  Document,
  ResponseModelResult,
  SensitiveField,
  DepartmentMaterial
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

  // Karta sprawy z index.html (edycja metadanych)
  editSygnatura = signal<string>('');
  editSubject = signal<string>('');
  editDateReceived = signal<string>('');
  editDateDeadline = signal<string>('');
  editContent = signal<string>('');
  editDecision = signal<string>('OCZEKUJE');
  editStage = signal<string>('BRAK_DZIALAN');
  selectedDepartments = signal<string[]>([]);
  isSavingCard = signal<boolean>(false);
  cardSavedNotice = signal<string | null>(null);

  readonly UMB_DEPTS = [
    { code: 'BKS', name: 'Biuro Komunikacji Społecznej' },
    { code: 'WIM', name: 'Wydział Inwestycji Miasta' },
    { code: 'WGK', name: 'Wydział Gospodarki Komunalnej' },
    { code: 'ZDMiKP', name: 'Zarząd Dróg Miejskich i KP' },
    { code: 'WES', name: 'Wydział Edukacji i Sportu' },
    { code: 'WFB', name: 'Wydział Budżetu i Finansów' },
    { code: 'WZP', name: 'Wydział Zamówień Publicznych' },
    { code: 'WMG', name: 'Wydział Mienia i Geodezji' }
  ];

  // Sekcja odpowiedzi z wydziału i anonimizacji
  departmentFeedback = signal<string>('');
  materialDepartment = signal('');
  departmentMaterials = signal<DepartmentMaterial[]>([]);
  isSavingMaterials = signal(false);
  isReadingMaterial = signal(false);
  materialMessage = signal<string | null>(null);
  isGeneratingResponse = signal<boolean>(false);
  responseModel = signal<ResponseModelResult | null>(null);
  activeTab = signal<'highlighted' | 'anonymized'>('highlighted');
  daneAnonimizacji = signal<SensitiveField[]>([]);
  officerNote = signal<string>(
    ''
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

  // Wyliczanie różnicy dni do terminu
  daysDiff = computed(() => {
    const deadline = this.editDateDeadline();
    if (!deadline) return 999;
    const parts = deadline.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return 999;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(parts[0], parts[1] - 1, parts[2]);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  });

  daysBadgeInfo = computed(() => {
    const dec = this.editDecision();
    const diff = this.daysDiff();
    const doc = this.document();

    if (dec === 'ROZPATRZONY' || this.editStage() === 'ODPOWIEDZ_WYSLANA') {
      const repDate = (doc?.metadata?.dataOdpowiedzi as string) || this.editDateReceived();
      return { cls: 'days-ok', text: `Rozpatrzono: ${this.formatDatePL(repDate)}` };
    }
    if (diff < 0) {
      return { cls: 'days-red', text: `Po terminie: ${Math.abs(diff)} dni` };
    }
    if (diff === 0) {
      return { cls: 'days-red', text: 'Termin: Dziś' };
    }
    if (diff === 1) {
      return { cls: 'days-orange', text: 'Termin: Jutro' };
    }
    return { cls: 'days-blue', text: `Pozostało: ${diff} dni` };
  });

  decisionPillInfo = computed(() => {
    const dec = this.editDecision();
    if (dec === 'ROZPATRZONY') {
      return { cls: 'decision-pill dec-rozpatrzony', text: 'WNIOSEK ROZPATRZONY' };
    }
    if (dec === 'NIEROZPATRZONY') {
      return { cls: 'decision-pill dec-nierozpatrzony', text: 'WNIOSEK NIE ROZPATRZONY' };
    }
    return { cls: 'decision-pill dec-oczekuje', text: 'W TOKU' };
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService,
    private udipState: UdipStateService
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
        this.initEditCardData(doc);
        this.initExistingResponseData(doc);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  private initEditCardData(doc: Document): void {
    const sygn = (doc.metadata?.numerSprawy || doc.metadata?.caseNumber || doc.title.split(' - ')[0] || doc.id).trim();
    let subj = (doc.metadata?.przedmiotZapytania as string) || doc.title;
    if (subj.includes(' - ') && !doc.metadata?.przedmiotZapytania) {
      const parts = subj.split(' - ');
      parts.shift();
      subj = parts.join(' - ');
    }

    const dateRec = (doc.metadata?.dataWplywu as string || doc.createdAt || '').substring(0, 10);
    let dateDead = (doc.metadata?.terminOdpowiedzi as string || '').substring(0, 10);
    if (!dateDead || dateDead.length !== 10) {
      dateDead = this.calculateDeadline(dateRec, 14);
    }

    const rawStatus = (doc.metadata?.status || '').toLowerCase();
    let dec = (doc.metadata?.decision as string) || '';
    if (!dec) {
      if (rawStatus === 'odpowiedziano' || rawStatus === 'zrealizowane' || doc.metadata?.odpowiedzZatwierdzona) {
        dec = 'ROZPATRZONY';
      } else if (rawStatus === 'nierozpatrzony' || rawStatus === 'odrzucony') {
        dec = 'NIEROZPATRZONY';
      } else {
        dec = 'OCZEKUJE';
      }
    }

    let stg = (doc.metadata?.stage as string) || '';
    if (!stg) {
      if (dec === 'ROZPATRZONY') stg = 'ODPOWIEDZ_WYSLANA';
      else if (rawStatus === 'zapytania') stg = 'ZAPYTANIA_WYDZIALY';
      else if (rawStatus === 'kwerenda') stg = 'KWERENDA';
      else if (rawStatus === 'w toku' || rawStatus === 'w trakcie') stg = 'W_PRZYGOTOWANIU';
      else stg = 'BRAK_DZIALAN';
    }

    const depts: string[] = [];
    if (Array.isArray(doc.metadata?.departments)) {
      doc.metadata.departments.forEach((d: string) => depts.push(d));
    } else if (doc.metadata?.department) {
      depts.push(doc.metadata.department as string);
    }
    if (depts.length === 0) {
      depts.push('BKS');
    }

    this.editSygnatura.set(sygn);
    this.editSubject.set(subj);
    this.editDateReceived.set(dateRec);
    this.editDateDeadline.set(dateDead);
    this.editContent.set(doc.content);
    this.editDecision.set(dec);
    this.editStage.set(stg);
    this.selectedDepartments.set(Array.from(new Set(depts)));
  }

  markRozpatrzony(): void {
    this.editDecision.set('ROZPATRZONY');
    this.editStage.set('ODPOWIEDZ_WYSLANA');
    this.saveCard('WNIOSEK ROZPATRZONY');
  }

  markNieRozpatrzony(): void {
    this.editDecision.set('NIEROZPATRZONY');
    this.editStage.set('BRAK_DZIALAN');
    this.saveCard('WNIOSEK NIE ROZPATRZONY');
  }

  onDateReceivedChange(newDate: string): void {
    this.editDateReceived.set(newDate);
    this.editDateDeadline.set(this.calculateDeadline(newDate, 14));
  }

  toggleDept(code: string): void {
    const current = this.selectedDepartments();
    if (current.includes(code)) {
      this.selectedDepartments.set(current.filter((c) => c !== code));
    } else {
      this.selectedDepartments.set([...current, code]);
    }
  }

  isDeptSelected(code: string): boolean {
    return this.selectedDepartments().includes(code);
  }

  saveCard(actionLabel?: string): void {
    const doc = this.document();
    if (!doc) return;

    this.isSavingCard.set(true);
    this.cardSavedNotice.set(null);

    const todayIso = new Date().toISOString().substring(0, 10);
    const dateReplied =
      this.editDecision() === 'ROZPATRZONY'
        ? (doc.metadata?.dataOdpowiedzi as string) || todayIso
        : '';

    const updatePayload = {
      title: `${this.editSygnatura()} - ${this.editSubject()}`,
      content: this.editContent(),
      metadata: {
        numerSprawy: this.editSygnatura(),
        caseNumber: this.editSygnatura(),
        przedmiotZapytania: this.editSubject(),
        dataWplywu: this.editDateReceived(),
        terminOdpowiedzi: this.editDateDeadline(),
        dataOdpowiedzi: dateReplied,
        decision: this.editDecision(),
        stage: this.editStage(),
        status:
          this.editDecision() === 'ROZPATRZONY'
            ? 'odpowiedziano'
            : this.editDecision() === 'NIEROZPATRZONY'
            ? 'nierozpatrzony'
            : 'w toku',
        departments: this.selectedDepartments(),
        department: this.selectedDepartments()[0] || 'BKS'
      }
    };

    this.documentService.updateDocument(doc.id, updatePayload).subscribe({
      next: (updatedDoc) => {
        this.document.set(updatedDoc);
        this.isSavingCard.set(false);
        const msg = actionLabel
          ? `${this.editSygnatura()}: ${actionLabel}.`
          : `Zapisano zmiany w karcie sprawy ${this.editSygnatura()}.`;
        this.cardSavedNotice.set(msg);
        this.udipState.showToast(msg);
        this.udipState.triggerReload();
        setTimeout(() => this.cardSavedNotice.set(null), 3000);
      },
      error: (err: Error) => {
        this.isSavingCard.set(false);
        this.errorMessage.set(err.message || 'Nie udało się zaktualizować karty sprawy w backendzie.');
      }
    });
  }

  private calculateDeadline(dateIso: string, days: number): string {
    if (!dateIso) return '';
    const parts = dateIso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return dateIso;
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    dt.setDate(dt.getDate() + days);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatDatePL(iso?: string): string {
    if (!iso) return '—';
    const p = iso.substring(0, 10).split('-');
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : iso;
  }

  private initExistingResponseData(doc: Document): void {
    const materials = doc.metadata.materialyWydzialow;
    this.departmentMaterials.set(Array.isArray(materials) ? materials.filter(
      item => typeof item?.department === 'string' && typeof item?.text === 'string'
    ) : []);
    this.materialDepartment.set(doc.metadata.department || '');
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

  async importMaterial(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.isReadingMaterial.set(true);
    this.materialMessage.set(null);
    try {
      const text = (await this.documentService.readDocumentFile(file)).trim();
      if (!text) throw new Error('Plik nie zawiera treści.');
      this.departmentFeedback.update(current => current.trim() ? current + '\n\n' + text : text);
    } catch (error) {
      this.materialMessage.set(error instanceof Error ? error.message : 'Nie udało się odczytać pliku.');
    } finally {
      this.isReadingMaterial.set(false);
    }
  }

  addMaterial(): void {
    const department = this.materialDepartment().trim();
    const text = this.departmentFeedback().trim();
    if (!department || !text) return;
    this.saveMaterials([...this.departmentMaterials(), { department, text }], () => {
      if (text === this.departmentFeedback().trim()) this.departmentFeedback.set('');
    });
  }

  removeMaterial(index: number): void {
    this.saveMaterials(this.departmentMaterials().filter((_, itemIndex) => itemIndex !== index));
  }

  private saveMaterials(materials: DepartmentMaterial[], onSaved?: () => void): void {
    const doc = this.document();
    if (!doc || this.isSavingMaterials() || this.isGeneratingResponse()) return;
    this.isSavingMaterials.set(true);
    this.materialMessage.set(null);
    this.documentService.updateDocument(doc.id, { metadata: { materialyWydzialow: materials } }).subscribe({
      next: updated => {
        this.document.set(updated);
        this.departmentMaterials.set(materials);
        this.isSavingMaterials.set(false);
        onSaved?.();
      },
      error: (error: Error) => {
        this.isSavingMaterials.set(false);
        this.materialMessage.set(error.message);
      },
    });
  }

  // --- Generowanie modelu odpowiedzi urzędowej ---
  generateResponse(): void {
    const doc = this.document();
    if (!doc || this.isGeneratingResponse() || this.isSavingMaterials() || this.isReadingMaterial()) return;
    const current = this.departmentFeedback().trim();
    const materials = this.departmentMaterials();
    const pending = current ? [{ department: this.materialDepartment().trim() || 'Wydział merytoryczny', text: current }] : [];
    const feedback = [...materials, ...pending].map(item => `${item.department}:\n${item.text}`).join('\n\n');

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
    if (!doc || !model || this.isApproving()) return;

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
          this.editDecision.set(updatedDoc.metadata.decision ?? '');
          this.isApproving.set(false);
          const message = 'Zatwierdzono odpowiedź. Wniosek rozpatrzony.';
          this.approvalSuccessMessage.set(message);
          this.udipState.showToast(message);
          this.udipState.triggerReload();
          void this.router.navigate(['/documents']);
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
