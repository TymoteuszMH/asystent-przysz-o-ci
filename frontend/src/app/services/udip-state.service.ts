import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CalendarFilterState {
  calDate: string | null;
  globalSearch: string;
  selectedYear: string;
  activeView: 'ALL' | 'URGENT' | 'RESOLVED';
}

@Injectable({
  providedIn: 'root'
})
export class UdipStateService {
  private filterStateSubject = new BehaviorSubject<CalendarFilterState>({
    calDate: null,
    globalSearch: '',
    selectedYear: 'ALL',
    activeView: 'ALL'
  });

  filterState$ = this.filterStateSubject.asObservable();

  private countsSubject = new BehaviorSubject<{ all: number; urgent: number; resolved: number }>({
    all: 0,
    urgent: 0,
    resolved: 0
  });

  counts$ = this.countsSubject.asObservable();

  private toastSubject = new BehaviorSubject<string | null>(null);
  toast$ = this.toastSubject.asObservable();

  private reloadTriggerSubject = new BehaviorSubject<number>(0);
  reloadTrigger$ = this.reloadTriggerSubject.asObservable();

  setFilterState(partial: Partial<CalendarFilterState>) {
    this.filterStateSubject.next({
      ...this.filterStateSubject.value,
      ...partial
    });
  }

  getFilterState(): CalendarFilterState {
    return this.filterStateSubject.value;
  }

  setCounts(counts: { all: number; urgent: number; resolved: number }) {
    this.countsSubject.next(counts);
  }

  triggerReload() {
    this.reloadTriggerSubject.next(Date.now());
  }

  showToast(msg: string) {
    this.toastSubject.next(msg);
  }
}
