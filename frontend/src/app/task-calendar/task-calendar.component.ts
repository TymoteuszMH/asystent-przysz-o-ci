import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TaskService } from './task.service';
import { TaskSidebarComponent } from './task-sidebar.component';
import { CalendarDayCell } from './task.model';

@Component({
  selector: 'app-task-calendar',
  standalone: true,
  imports: [CommonModule, TaskSidebarComponent],
  styleUrls: ['./task-calendar.component.css'],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50">
      <header class="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="goBackToDocuments()"
            class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Powrót do tabeli wniosków UDIP"
          >
            <span>← Powrót do wniosków</span>
          </button>
          <div>
            <h1 class="text-lg font-extrabold text-slate-900">Kalendarz Zadań i Realizacji</h1>
            <p class="text-xs text-slate-500">Moduł zadań i terminów Urzędu Miasta Bydgoszczy</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button (click)="prevMonth()" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold">‹</button>
          <button (click)="goToday()" class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">Dzisiaj</button>
          <button (click)="nextMonth()" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold">›</button>
          <span class="px-3 font-extrabold text-slate-800 capitalize">{{ monthLabel() }}</span>
        </div>

        <div class="flex items-center gap-2">
          @if (taskService.overdueTasksCount() > 0) {
            <button (click)="taskService.rolloverOverdueTasks()" class="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              ↻ Przenieś zaległe ({{ taskService.overdueTasksCount() }})
            </button>
          }
          <button (click)="taskService.exportToJson()" class="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            ⬇ Eksport JSON
          </button>
        </div>
      </header>

      <main class="flex-1 max-w-[1480px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <section class="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-bold uppercase text-slate-500">
            <div>Pon</div><div>Wt</div><div>Śr</div><div>Czw</div><div>Pt</div><div class="text-rose-600">Sob</div><div class="text-rose-600">Ndz</div>
          </div>
          <div class="grid grid-cols-7 bg-slate-200 gap-[1px]">
            @for (cell of calendarCells(); track cell.iso) {
              <div
                (click)="taskService.selectedDate.set(cell.iso)"
                class="min-h-[110px] p-2 flex flex-col gap-1 cursor-pointer transition"
                [ngClass]="{
                  'bg-blue-50 ring-2 ring-inset ring-blue-600': cell.iso === taskService.selectedDate(),
                  'bg-white': cell.inCurrentMonth && cell.iso !== taskService.selectedDate(),
                  'bg-slate-50 text-slate-400': !cell.inCurrentMonth && cell.iso !== taskService.selectedDate()
                }"
              >
                <span class="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center" [ngClass]="cell.isToday ? 'bg-blue-600 text-white' : ''">
                  {{ cell.dayNum }}
                </span>
                @for (t of cell.tasks.slice(0, 3); track t.id) {
                  <div class="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] truncate" [class.line-through]="t.completed">
                    {{ t.title }}
                  </div>
                }
              </div>
            }
          </div>
        </section>

        <aside class="lg:col-span-4 sticky top-6">
          <app-task-sidebar
            [selectedDate]="taskService.selectedDate()"
            [tasks]="taskService.tasksForSelectedDate()"
            (taskToggled)="taskService.toggleTaskCompletion($event.id, $event.completed)"
            (taskDeleted)="taskService.deleteTask($event)"
            (quickTaskAdded)="taskService.addQuickTask($event.title, $event.priority)"
          />
        </aside>
      </main>
    </div>
  `
})
export class TaskCalendarComponent {
  private readonly router = inject(Router);
  readonly taskService = inject(TaskService);
  private readonly cursorDate = signal(new Date());

  readonly monthLabel = computed(() =>
    this.cursorDate().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
  );

  readonly calendarCells = computed<CalendarDayCell[]>(() => {
    const cursor = this.cursorDate();
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    let startOffset = firstOfMonth.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const gridStart = new Date(year, month, 1 - startOffset);
    const totalCells = Math.ceil((startOffset + lastOfMonth.getDate()) / 7) * 7;
    const todayIso = this.taskService.getTodayISO();
    const allFiltered = this.taskService.filteredTasks();

    const cells: CalendarDayCell[] = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cells.push({
        iso,
        dayNum: d.getDate(),
        inCurrentMonth: d.getMonth() === month,
        isToday: iso === todayIso,
        tasks: allFiltered.filter(t => t.date === iso)
      });
    }
    return cells;
  });

  prevMonth(): void {
    const d = new Date(this.cursorDate());
    d.setMonth(d.getMonth() - 1);
    this.cursorDate.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.cursorDate());
    d.setMonth(d.getMonth() + 1);
    this.cursorDate.set(d);
  }

  goToday(): void {
    const now = new Date();
    this.cursorDate.set(now);
    this.taskService.selectedDate.set(this.taskService.getTodayISO());
  }

  goBackToDocuments(): void {
    this.router.navigate(['/documents']);
  }
}
