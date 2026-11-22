import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { UdipStateService } from './services/udip-state.service';
import { DocumentService } from './services/document.service';
import { Document } from './models/document.model';
import { TaskService } from './task-calendar/task.service';

interface CalCell {
  day: number | null;
  iso: string;
  isToday: boolean;
  dueCls: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'UDIP Bydgoszcz – Asystent Urzędnika';
  drawerCollapsed = false;

  globalSearch = '';
  selectedYear = 'ALL';
  activeView: 'ALL' | 'URGENT' | 'RESOLVED' = 'ALL';

  backendStatus = 'Łączenie…';

  currentUrl = signal<string>('/documents');

  countAll = 0;
  countUrgent = 0;
  countResolved = 0;

  calDows = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
  calCells: CalCell[] = [];
  calSelectedDate: string | null = null;
  calMonthLabel = '';
  calSelectedLabel = '';

  private calYear = new Date().getFullYear();
  private calMonth = new Date().getMonth();

  private documents: Document[] = [];
  private subs: Subscription = new Subscription();

  toastMessage = '';
  toastVisible = false;
  private toastTimer: any = null;

  private readonly MONTHS_PL = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  constructor(
    private router: Router,
    private udipState: UdipStateService,
    private documentService: DocumentService,
    public taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.currentUrl.set(this.router.url);

    this.subs.add(
      this.router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd)
      ).subscribe((e: NavigationEnd) => {
        this.currentUrl.set(e.urlAfterRedirects || e.url);
      })
    );

    this.subs.add(
      this.udipState.counts$.subscribe(counts => {
        this.countAll = counts.all;
        this.countUrgent = counts.urgent;
        this.countResolved = counts.resolved;
      })
    );

    this.subs.add(
      this.udipState.toast$.subscribe(msg => {
        if (msg) {
          this.triggerToast(msg);
        }
      })
    );

    this.subs.add(
      this.udipState.filterState$.subscribe(state => {
        this.globalSearch = state.globalSearch;
        this.selectedYear = state.selectedYear;
        this.activeView = state.activeView;
        this.calSelectedDate = state.calDate;
        this.updateCalSelectedLabel();
      })
    );

    this.loadDocumentsForCalendar();

    this.subs.add(
      this.udipState.reloadTrigger$.subscribe(() => {
        this.loadDocumentsForCalendar();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  loadDocumentsForCalendar(): void {
    this.documentService.getDocuments().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.backendStatus = 'Połączono';
        this.renderCalendar();
      },
      error: () => {
        this.backendStatus = 'Brak połączenia';
      }
    });
  }

  get isNewRequestUnavailable(): boolean {
    return this.router.isActive('/documents/new', {
      paths: 'exact',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    });
  }

  openRequestCreator(): void {
    if (this.isNewRequestUnavailable) return;
    void this.router.navigate(['/documents/new']);
  }

  toggleDrawer(): void {
    this.drawerCollapsed = !this.drawerCollapsed;
  }

  goHome(): void {
    this.router.navigate(['/documents']);
  }

  onGlobalSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.globalSearch = input.value;
    this.udipState.setFilterState({ globalSearch: this.globalSearch });
  }

  clearGlobalSearch(): void {
    this.globalSearch = '';
    this.udipState.setFilterState({ globalSearch: '' });
  }

  onYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedYear = select.value;
    this.udipState.setFilterState({ selectedYear: this.selectedYear });
  }

  setView(view: 'ALL' | 'URGENT' | 'RESOLVED'): void {
    this.activeView = view;
    this.udipState.setFilterState({ activeView: view });
    if (this.router.url !== '/documents') {
      this.router.navigate(['/documents']);
    }
  }

  get isCalendarView(): boolean {
    return this.currentUrl().startsWith('/calendar');
  }

  openCalendar(): void {
    const targetDate = this.calSelectedDate || this.taskService.getTodayISO();
    this.taskService.selectedDate.set(targetDate);
    if (!this.isCalendarView) {
      this.router.navigate(['/calendar']);
    }
  }

  calPrev(): void {
    this.calMonth--;
    if (this.calMonth < 0) {
      this.calMonth = 11;
      this.calYear--;
    }
    this.renderCalendar();
  }

  calNext(): void {
    this.calMonth++;
    if (this.calMonth > 11) {
      this.calMonth = 0;
      this.calYear++;
    }
    this.renderCalendar();
  }

  onCalDayClick(iso: string): void {
    if (this.calSelectedDate === iso) {
      this.calSelectedDate = null;
    } else {
      this.calSelectedDate = iso;
    }
    this.udipState.setFilterState({ calDate: this.calSelectedDate });
    this.updateCalSelectedLabel();
    this.renderCalendar();
    if (this.router.url !== '/documents') {
      this.router.navigate(['/documents']);
    }
  }

  private updateCalSelectedLabel(): void {
    if (!this.calSelectedDate) {
      this.calSelectedLabel = '';
      return;
    }
    const parts = this.calSelectedDate.split('-');
    if (parts.length === 3) {
      this.calSelectedLabel = `${parts[2]}.${parts[1]}.${parts[0]}`;
    } else {
      this.calSelectedLabel = this.calSelectedDate;
    }
  }

  private toLocalISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getTodayLocal(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private diffDaysFromToday(iso: string): number {
    if (!iso) return 999;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return 999;
    const target = new Date(parts[0], parts[1] - 1, parts[2]);
    return Math.round((target.getTime() - this.getTodayLocal().getTime()) / 86400000);
  }

  private isResolved(doc: Document): boolean {
    const status = (doc.metadata?.status || '').toLowerCase();
    return status === 'odpowiedziano' || status === 'zrealizowane' || !!doc.metadata?.dataOdpowiedzi;
  }

  private renderCalendar(): void {
    this.calMonthLabel = `${this.MONTHS_PL[this.calMonth]} ${this.calYear}`;
    const todayIso = this.toLocalISO(this.getTodayLocal());

    const firstDay = new Date(this.calYear, this.calMonth, 1);
    const totalDays = new Date(this.calYear, this.calMonth + 1, 0).getDate();
    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6;

    const cells: CalCell[] = [];

    for (let i = 0; i < offset; i++) {
      cells.push({ day: null, iso: '', isToday: false, dueCls: '' });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(this.calYear, this.calMonth, d);
      const iso = this.toLocalISO(dt);

      const matches = this.documents.filter(doc => {
        const deadline = doc.metadata?.terminOdpowiedzi;
        return deadline === iso;
      });

      let dueCls = '';
      if (matches.length > 0) {
        const diff = this.diffDaysFromToday(iso);
        const hasOpen = matches.some(doc => !this.isResolved(doc));
        if (hasOpen && diff <= 0) {
          dueCls = 'due-red';
        } else if (hasOpen && diff === 1) {
          dueCls = 'due-orange';
        } else {
          dueCls = 'due-blue';
        }
      }

      cells.push({
        day: d,
        iso,
        isToday: iso === todayIso,
        dueCls
      });
    }

    this.calCells = cells;
  }

  private triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 2500);
  }
}
