import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestAnonymizationComponent } from '../request-anonymization/request-anonymization.component';
import { DocumentService } from '../../services/document.service';
import { UdipStateService } from '../../services/udip-state.service';
import { Document, RequestAnonymizationFields } from '../../models/document.model';

@Component({
  selector: 'app-new-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RequestAnonymizationComponent],
  templateUrl: './new-request-modal.component.html',
  styleUrls: ['./new-request-modal.component.css']
})
export class NewRequestModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() totalCasesCount = 16;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<Document>();

  @ViewChild(RequestAnonymizationComponent) anonymization?: RequestAnonymizationComponent;

  applyAnonymization(fields: RequestAnonymizationFields): void {
    this.subject = fields.title;
    this.content = fields.content;
  }

  sygnatura = '';
  dateReceived = '';
  subject = '';
  content = '';

  isSaving = false;
  errorMessage: string | null = null;

  private readonly UMB_DEPTS = [
    { code: 'BKS', name: 'Biuro Komunikacji Społecznej', keys: ['bks', 'obywatelsk', 'bbo'] },
    { code: 'WIM', name: 'Wydział Inwestycji Miasta', keys: ['inwestycj', 'budow', 'astori', 'młyn'] },
    { code: 'WGK', name: 'Wydział Gospodarki Komunalnej', keys: ['zwierz', 'schronisk', 'odpad', 'zieleń', 'drzew'] },
    { code: 'ZDMiKP', name: 'Zarząd Dróg Miejskich i KP', keys: ['drog', 'tramwaj', 'parkowani', 'spp', '102/tt/2019'] },
    { code: 'WES', name: 'Wydział Edukacji i Sportu', keys: ['szkoł', 'sport', 'torbyd', 'basen', 'uczni'] },
    { code: 'WFB', name: 'Wydział Budżetu i Finansów', keys: ['budżet', 'koszt', 'wydat', 'rejestr umów'] },
    { code: 'WZP', name: 'Wydział Zamówień Publicznych', keys: ['przetarg', 'umow'] },
    { code: 'WMG', name: 'Wydział Mienia i Geodezji', keys: ['lokal', 'najem', 'mieni'] }
  ];

  constructor(
    private documentService: DocumentService,
    private udipState: UdipStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initFormDefaults();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.initFormDefaults();
    }
  }

  private initFormDefaults(): void {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    this.dateReceived = `${y}-${m}-${d}`;
    this.sygnatura = `BKS.IV.1431.${600 + this.totalCasesCount}.${y}`;
    this.subject = '';
    this.content = '';
    this.errorMessage = null;
    this.isSaving = false;
  }

  private addDays(iso: string, days: number): string {
    const parts = iso.split('-').map(Number);
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    dt.setDate(dt.getDate() + days);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  suggestDepartments(text: string): string[] {
    const lower = (text || '').toLowerCase();
    const matched = this.UMB_DEPTS
      .map(d => ({ code: d.code, hits: d.keys.filter(k => lower.includes(k)).length }))
      .filter(x => x.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .map(x => x.code);
    return matched.length > 0 ? matched.slice(0, 3) : ['BKS', 'WFB'];
  }

  onClose(): void {
    this.close.emit();
  }

  async goToFullCreator(): Promise<void> {
    try {
      if (await this.router.navigate(['/documents/new'])) this.onClose();
    } catch {
      this.errorMessage = 'Nie udało się otworzyć zaawansowanego kreatora.';
    }
  }

  saveCase(): void {
    if (this.anonymization?.isReviewPending || this.isSaving) return;
    const sygn = this.sygnatura.trim();
    const subj = this.subject.trim();
    const cont = this.content.trim();

    if (!sygn || !subj || !cont) {
      this.errorMessage = 'Uzupełnij sygnaturę, temat i treść wniosku.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;

    const depts = this.suggestDepartments(`${subj} ${cont}`);
    const deadline = this.addDays(this.dateReceived, 14);

    const newDocDto = {
      title: `${sygn} - ${subj}`,
      content: cont,
      author: 'Wnioskodawca',
      tags: ['informacja publiczna', ...depts.map(d => d.toLowerCase())],
      metadata: {
        numerSprawy: sygn,
        caseNumber: sygn,
        przedmiotZapytania: subj,
        dataWplywu: this.dateReceived,
        terminOdpowiedzi: deadline,
        dataOdpowiedzi: '',
        stage: 'BRAK_DZIALAN',
        decision: 'OCZEKUJE',
        status: 'nowy',
        department: depts[0] || 'BKS',
        departments: depts,
        rekomendowaneWydzialy: depts,
      }
    };

    // Zapis poprzez API backendu NestJS (POST /documents)
    this.documentService.createDocument(newDocDto).subscribe({
      next: (createdDoc) => {
        this.isSaving = false;
        this.udipState.showToast(`Dodano wniosek ${sygn} do bazy.`);
        this.udipState.triggerReload();
        this.created.emit(createdDoc);
        this.onClose();
      },
      error: (err: Error) => {
        this.isSaving = false;
        this.errorMessage = err.message || 'Nie udało się zapisać wniosku w backendzie.';
      }
    });
  }
}
