import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DocumentService } from '../../services/document.service';
import { UdipStateService } from '../../services/udip-state.service';
import { Document } from '../../models/document.model';

export interface CaseViewItem {
  doc: Document;
  sygnatura: string;
  subject: string;
  applicant: string;
  stage: string;
  stageLabel: string;
  decision: string;
  decisionLabel: string;
  decCls: string;
  dateDeadline: string;
  dateDeadlineFormatted: string;
  dateReceived: string;
  dateReceivedFormatted: string;
  diffDays: number;
  rowCls: string;
  badgeCls: string;
  badgeTxt: string;
  departments: string[];
  deptCode: string;
}

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css']
})
export class DocumentListComponent implements OnInit, OnDestroy {
  documents: Document[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  filtersExpanded = false;

  filterStage = 'ALL';
  filterDeadlineScope = 'ALL';
  filterDecision = 'ALL';
  filterDept = 'ALL';
  filterYear = 'ALL';
  filterSort = 'OLDEST';

  globalSearch = '';
  calDate: string | null = null;
  activeView: 'ALL' | 'URGENT' | 'RESOLVED' = 'ALL';

  departmentsList = [
    { code: 'BKS', name: 'Biuro Komunikacji Społecznej' },
    { code: 'WIM', name: 'Wydział Inwestycji Miasta' },
    { code: 'WGK', name: 'Wydział Gospodarki Komunalnej' },
    { code: 'ZDMiKP', name: 'Zarząd Dróg Miejskich i KP' },
    { code: 'WES', name: 'Wydział Edukacji i Sportu' },
    { code: 'WFB', name: 'Wydział Budżetu i Finansów' },
    { code: 'WZP', name: 'Wydział Zamówień Publicznych' },
    { code: 'WMG', name: 'Wydział Mienia i Geodezji' }
  ];

  readonly STAGE_LABELS: Record<string, string> = {
    BRAK_DZIALAN: 'Brak działań',
    ZAPYTANIA_WYDZIALY: 'Zapytania w wydziałach',
    KWERENDA: 'Kwerenda',
    W_PRZYGOTOWANIU: 'W przygotowaniu',
    ODPOWIEDZ_WYSLANA: 'Odpowiedź wysłana'
  };

  private subs: Subscription = new Subscription();

  constructor(
    private documentService: DocumentService,
    private udipState: UdipStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.udipState.filterState$.subscribe(state => {
        this.globalSearch = state.globalSearch;
        this.filterYear = state.selectedYear;
        this.activeView = state.activeView;
        this.calDate = state.calDate;
      })
    );

    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.documentService.getDocuments().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.isLoading = false;
        this.updateCounts();
      },
      error: (err: Error) => {
        this.isLoading = false;
        this.errorMessage = err.message;
      }
    });
  }

  refreshData(): void {
    this.loadDocuments();
    this.udipState.triggerReload();
    this.udipState.showToast('Odświeżono listę wniosków.');
  }

  resetData(): void {
    if (!window.confirm('To zastąpi wszystkie zapisane sprawy i materiały 16 przykładowymi wnioskami. Kontynuować?')) return;
    this.isLoading = true;
    this.documentService.resetDocuments().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.isLoading = false;
        this.updateCounts();
        this.udipState.triggerReload();
        this.udipState.showToast('Przywrócono przykładowe wnioski.');
      },
      error: (err: Error) => {
        this.isLoading = false;
        this.errorMessage = err.message;
      }
    });
  }

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  setFilter(field: 'stage' | 'deadlineScope' | 'decision' | 'dept' | 'year' | 'sort', val: string): void {
    if (field === 'stage') this.filterStage = val;
    else if (field === 'deadlineScope') this.filterDeadlineScope = val;
    else if (field === 'decision') this.filterDecision = val;
    else if (field === 'dept') this.filterDept = val;
    else if (field === 'year') {
      this.filterYear = val;
      this.udipState.setFilterState({ selectedYear: val });
    }
    else if (field === 'sort') this.filterSort = val;
  }

  clearAllFilters(): void {
    this.filterStage = 'ALL';
    this.filterDeadlineScope = 'ALL';
    this.filterDecision = 'ALL';
    this.filterDept = 'ALL';
    this.filterYear = 'ALL';
    this.filterSort = 'OLDEST';
    this.calDate = null;
    this.globalSearch = '';
    this.activeView = 'ALL';

    this.udipState.setFilterState({
      calDate: null,
      globalSearch: '',
      selectedYear: 'ALL',
      activeView: 'ALL'
    });

    this.udipState.showToast('Wyczyszczono filtry.');
  }

  removeTag(key: string): void {
    if (key === 'stage') this.filterStage = 'ALL';
    else if (key === 'deadlineScope') this.filterDeadlineScope = 'ALL';
    else if (key === 'decision') this.filterDecision = 'ALL';
    else if (key === 'dept') this.filterDept = 'ALL';
    else if (key === 'year') {
      this.filterYear = 'ALL';
      this.udipState.setFilterState({ selectedYear: 'ALL' });
    }
    else if (key === 'calDate') {
      this.calDate = null;
      this.udipState.setFilterState({ calDate: null });
    }
    else if (key === 'globalSearch') {
      this.globalSearch = '';
      this.udipState.setFilterState({ globalSearch: '' });
    }
  }

  openDetail(docId: string): void {
    this.router.navigate(['/documents', docId]);
  }

  get filteredCases(): CaseViewItem[] {
    const list = this.documents.map(d => this.mapDocToViewItem(d));
    const q = this.globalSearch.trim().toLowerCase();

    const filtered = list.filter(item => {
      // Widok z lewego menu
      const isRes = this.isItemResolved(item);
      const isUrg = !isRes && item.diffDays <= 1;

      if (this.activeView === 'URGENT' && !isUrg) return false;
      if (this.activeView === 'RESOLVED' && !isRes) return false;

      // Rok
      if (this.filterYear !== 'ALL' && !item.dateReceived.startsWith(this.filterYear)) return false;

      // Kliknięty dzień w kalendarzu
      if (this.calDate && item.dateDeadline !== this.calDate) return false;

      if (this.filterStage !== 'ALL' && item.stage !== this.filterStage) return false;
      if (this.filterDept !== 'ALL' && !item.departments.includes(this.filterDept)) return false;

      if (this.filterDecision !== 'ALL' && item.decision !== this.filterDecision) return false;

      if (this.filterDeadlineScope === 'OVERDUE' && (isRes || item.diffDays >= 0)) return false;
      if (this.filterDeadlineScope === 'TODAY' && (isRes || item.diffDays !== 0)) return false;
      if (this.filterDeadlineScope === 'TOMORROW' && (isRes || item.diffDays !== 1)) return false;
      if (this.filterDeadlineScope === 'NEXT_7' && (isRes || item.diffDays < 0 || item.diffDays > 7)) return false;

      // Szukajka
      if (q) {
        const text = `${item.sygnatura} ${item.subject} ${item.doc.content} ${item.applicant} ${item.departments.join(' ')}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });

    // Sortowanie
    filtered.sort((a, b) => {
      if (this.filterSort === 'NEWEST') return b.dateReceived.localeCompare(a.dateReceived);
      if (this.filterSort === 'OLDEST') return a.dateReceived.localeCompare(b.dateReceived);

      const resA = this.isItemResolved(a);
      const resB = this.isItemResolved(b);
      if (resA && !resB) return 1;
      if (!resA && resB) return -1;
      return a.dateDeadline.localeCompare(b.dateDeadline);
    });

    return filtered;
  }

  private readonly deadlineLabels: Record<string, string> = {
    OVERDUE: 'po terminie',
    TODAY: 'dzisiaj',
    TOMORROW: 'jutro',
    NEXT_7: 'w ciągu 7 dni'
  };

  private readonly decisionLabels: Record<string, string> = {
    ROZPATRZONY: 'rozpatrzony',
    NIEROZPATRZONY: 'nierozpatrzony',
    OCZEKUJE: 'w toku',
    DO_USCISLENIA: 'oczekuje na uściślenie'
  };

  get activeTags(): { key: string; text: string }[] {
    const tags: { key: string; text: string }[] = [];
    if (this.filterStage !== 'ALL') tags.push({ key: 'stage', text: `Etap: ${this.STAGE_LABELS[this.filterStage] || this.filterStage}` });
    if (this.filterDeadlineScope !== 'ALL') tags.push({ key: 'deadlineScope', text: `Termin: ${this.deadlineLabels[this.filterDeadlineScope]}` });
    if (this.filterDecision !== 'ALL') tags.push({ key: 'decision', text: `Decyzja: ${this.decisionLabels[this.filterDecision]}` });
    if (this.filterDept !== 'ALL') tags.push({ key: 'dept', text: `Wydział: ${this.filterDept}` });
    if (this.filterYear !== 'ALL') tags.push({ key: 'year', text: `Rok: ${this.filterYear}` });
    if (this.calDate) tags.push({ key: 'calDate', text: `Data: ${this.formatDatePL(this.calDate)}` });
    if (this.globalSearch.trim()) tags.push({ key: 'globalSearch', text: `Szukaj: ${this.globalSearch.trim()}` });
    return tags;
  }

  private readonly countRules = new Intl.PluralRules('pl');

  get foundCounterText(): string {
    const len = this.filteredCases.length;
    const category = this.countRules.select(len);
    const word = category === 'one' ? 'wniosek' : category === 'few' ? 'wnioski' : 'wniosków';
    return `Znaleziono ${len} ${word}`;
  }

  private updateCounts(): void {
    const list = this.documents.map(d => this.mapDocToViewItem(d));
    const all = list.length;
    const urgent = list.filter(item => !this.isItemResolved(item) && item.diffDays <= 1).length;
    const resolved = list.filter(item => this.isItemResolved(item)).length;

    this.udipState.setCounts({ all, urgent, resolved });
  }

  private isItemResolved(item: CaseViewItem): boolean {
    return item.decision === 'ROZPATRZONY' || item.stage === 'ODPOWIEDZ_WYSLANA';
  }

  private mapDocToViewItem(doc: Document): CaseViewItem {
    const sygnatura = (doc.metadata?.numerSprawy || doc.metadata?.caseNumber || doc.title.split(' - ')[0] || `ID: ${doc.id}`).trim();
    let subject = doc.title;
    if (subject.includes(' - ')) {
      const parts = subject.split(' - ');
      parts.shift();
      subject = parts.join(' - ');
    }

    const applicant = doc.metadata?.wnioskodawca || doc.metadata?.applicant || doc.author || '';

    // Data wpływu
    const dateReceived = (doc.metadata?.dataWplywu || doc.createdAt || '').substring(0, 10);

    // Termin
    let dateDeadline = (doc.metadata?.terminOdpowiedzi || '').substring(0, 10);
    if (!dateDeadline || dateDeadline.length !== 10) {
      dateDeadline = this.addDaysISO(dateReceived, 14);
    }

    const diffDays = this.diffDaysFromToday(dateDeadline);

    // Status / Rozstrzygnięcie
    const rawStatus = (doc.metadata?.status || '').toLowerCase();
    let decision = (doc.metadata?.decision as string) || '';
    let stage = (doc.metadata?.stage as string) || '';

    if (!decision) {
      if (rawStatus === 'odpowiedziano' || rawStatus === 'zrealizowane' || doc.metadata?.odpowiedzZatwierdzona) {
        decision = 'ROZPATRZONY';
      } else if (rawStatus === 'nierozpatrzony' || rawStatus === 'odrzucony') {
        decision = 'NIEROZPATRZONY';
      } else {
        decision = 'OCZEKUJE';
      }
    }

    if (!stage) {
      if (decision === 'ROZPATRZONY' || rawStatus === 'odpowiedziano' || rawStatus === 'zrealizowane') {
        stage = 'ODPOWIEDZ_WYSLANA';
      } else if (rawStatus === 'zapytania') {
        stage = 'ZAPYTANIA_WYDZIALY';
      } else if (rawStatus === 'kwerenda') {
        stage = 'KWERENDA';
      } else if (rawStatus === 'w toku' || rawStatus === 'w trakcie') {
        stage = 'W_PRZYGOTOWANIU';
      } else {
        stage = 'BRAK_DZIALAN';
      }
    }

    let decisionLabel = 'W TOKU';
    let decCls = 'dec-oczekuje';
    if (decision === 'ROZPATRZONY') {
      decisionLabel = 'WNIOSEK ROZPATRZONY';
      decCls = 'dec-rozpatrzony';
    } else if (decision === 'NIEROZPATRZONY') {
      decisionLabel = 'WNIOSEK NIE ROZPATRZONY';
      decCls = 'dec-nierozpatrzony';
    } else if (decision === 'DO_USCISLENIA') {
      decisionLabel = 'OCZEKUJE NA UŚCIŚLENIE';
    }

    const stageLabel = this.STAGE_LABELS[stage] || stage;

    // Badges & Colors
    const resolved = decision === 'ROZPATRZONY' || stage === 'ODPOWIEDZ_WYSLANA';
    let rowCls = '';
    let badgeCls = 'days-blue';
    let badgeTxt = `${diffDays} dni`;

    if (resolved) {
      rowCls = 'row-resolved';
      badgeCls = 'days-ok';
      badgeTxt = 'Rozpatrzono';
    } else if (diffDays < 0) {
      rowCls = 'row-red';
      badgeCls = 'days-red';
      badgeTxt = `Po terminie (${Math.abs(diffDays)}d)`;
    } else if (diffDays === 0) {
      rowCls = 'row-red';
      badgeCls = 'days-red';
      badgeTxt = 'Dziś';
    } else if (diffDays === 1) {
      rowCls = 'row-orange';
      badgeCls = 'days-orange';
      badgeTxt = 'Jutro';
    }

    // Departments
    const depts: string[] = [];
    if (Array.isArray(doc.metadata?.departments)) {
      doc.metadata.departments.forEach((d: string) => depts.push(this.normalizeDeptCode(d)));
    }
    if (doc.metadata?.department) {
      depts.push(this.normalizeDeptCode(doc.metadata.department));
    }
    if (doc.metadata?.rekomendowaneWydzialy && Array.isArray(doc.metadata.rekomendowaneWydzialy)) {
      doc.metadata.rekomendowaneWydzialy.forEach(d => {
        depts.push(this.normalizeDeptCode(d));
      });
    }

    // Wykrywanie na podstawie sygnatury lub treści jeśli brak
    if (depts.length === 0) {
      depts.push(...this.inferDepartments(sygnatura + ' ' + subject + ' ' + doc.content));
    }

    const uniqueDepts = Array.from(new Set(depts));
    const deptCode = uniqueDepts[0] || '';

    return {
      doc,
      sygnatura,
      subject,
      applicant,
      stage,
      stageLabel,
      decision,
      decisionLabel,
      decCls,
      dateDeadline,
      dateDeadlineFormatted: this.formatDatePL(dateDeadline),
      dateReceived,
      dateReceivedFormatted: this.formatDatePL(dateReceived),
      diffDays,
      rowCls,
      badgeCls,
      badgeTxt,
      departments: uniqueDepts,
      deptCode
    };
  }

  private normalizeDeptCode(deptName: string): string {
    const s = deptName.toUpperCase();
    if (s.includes('BKS') || s.includes('KOMUNIKACJI SPOŁECZNEJ')) return 'BKS';
    if (s.includes('WIM') || s.includes('INWESTYCJI')) return 'WIM';
    if (s.includes('WGK') || s.includes('KOMUNALNEJ') || s.includes('ZIELENI')) return 'WGK';
    if (s.includes('ZDMIKP') || s.includes('DRÓG')) return 'ZDMiKP';
    if (s.includes('WES') || s.includes('EDUKACJI')) return 'WES';
    if (s.includes('WFB') || s.includes('FINANSÓW') || s.includes('BUDŻET')) return 'WFB';
    if (s.includes('WZP') || s.includes('ZAMÓWIEŃ')) return 'WZP';
    if (s.includes('WMG') || s.includes('MIENIA') || s.includes('GEODEZJI')) return 'WMG';
    return deptName;
  }

  private inferDepartments(text: string): string[] {
    const lower = text.toLowerCase();
    const result: string[] = [];
    if (lower.includes('astori') || lower.includes('inwestycj') || lower.includes('budow')) result.push('WIM');
    if (lower.includes('zwierz') || lower.includes('odpad') || lower.includes('drzew') || lower.includes('zieleni')) result.push('WGK');
    if (lower.includes('drog') || lower.includes('parkowan') || lower.includes('spp') || lower.includes('tramwaj')) result.push('ZDMiKP');
    if (lower.includes('szkoł') || lower.includes('uczni') || lower.includes('edukacj') || lower.includes('sport')) result.push('WES');
    if (lower.includes('budżet') || lower.includes('koszt') || lower.includes('umów')) result.push('WFB');
    if (lower.includes('przetarg') || lower.includes('zamówien')) result.push('WZP');
    if (lower.includes('lokal') || lower.includes('nieruchomośc') || lower.includes('mieni')) result.push('WMG');
    if (result.length === 0) result.push('BKS');
    return result;
  }

  private formatDatePL(iso: string): string {
    if (!iso) return '—';
    const p = iso.split('-');
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : iso;
  }

  private addDaysISO(iso: string, days: number): string {
    if (!iso) return iso;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return iso;
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    dt.setDate(dt.getDate() + days);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  private diffDaysFromToday(iso: string): number {
    if (!iso) return 999;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return 999;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(parts[0], parts[1] - 1, parts[2]);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  }
}
