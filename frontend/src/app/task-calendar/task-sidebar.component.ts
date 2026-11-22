import { Component, input, output, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskPriority } from './task.model';

@Component({
  selector: 'app-task-sidebar',
  standalone: true,
  imports: [DatePipe, NgClass, FormsModule],
  styleUrls: ['./task-sidebar.component.css'],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div class="p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
        <h2 class="text-lg font-extrabold text-slate-900">{{ selectedDate() | date:'fullDate' }}</h2>
      </div>

      <form (ngSubmit)="submitQuickAdd()" class="p-3.5 bg-slate-50 border-b border-slate-200 flex gap-2">
        <input
          type="text"
          [ngModel]="quickTitle()"
          (ngModelChange)="quickTitle.set($event)"
          name="quickTitle"
          placeholder="Szybkie zadanie na ten dzień..."
          class="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
          required
        />
        <select
          [ngModel]="quickPriority()"
          (ngModelChange)="quickPriority.set($event)"
          name="quickPriority"
          class="px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
        >
          <option value="HIGH">Pilne</option>
          <option value="MEDIUM">Normalne</option>
          <option value="LOW">Niskie</option>
        </select>
        <button type="submit" class="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Dodaj
        </button>
      </form>

      <div class="p-4 flex flex-col gap-3 max-h-[62vh] overflow-y-auto">
        @if (tasks().length === 0) {
          <div class="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
            <div class="text-slate-400 font-bold text-sm">Brak zadań na ten dzień</div>
          </div>
        } @else {
          @for (task of tasks(); track task.id) {
            <div
              class="rounded-xl border p-3.5 shadow-sm transition"
              [ngClass]="task.completed ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'"
            >
              <div class="flex items-start justify-between gap-2.5">
                <label class="flex items-start gap-2.5 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    [checked]="task.completed"
                    (change)="onToggle(task.id, $event)"
                    class="mt-1"
                  />
                  <div>
                    <div class="text-sm font-bold" [class.line-through]="task.completed">{{ task.title }}</div>
                    @if (task.notes) {
                      <p class="text-xs text-slate-500 mt-1">{{ task.notes }}</p>
                    }
                  </div>
                </label>
                <button type="button" (click)="taskDeleted.emit(task.id)" class="text-slate-400 hover:text-rose-600 text-xs font-bold">
                  ✕
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class TaskSidebarComponent {
  selectedDate = input.required<string>();
  tasks = input.required<Task[]>();

  taskToggled = output<{ id: string; completed: boolean }>();
  taskDeleted = output<string>();
  quickTaskAdded = output<{ title: string; priority: TaskPriority }>();

  quickTitle = signal('');
  quickPriority = signal<TaskPriority>('MEDIUM');

  onToggle(taskId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.taskToggled.emit({ id: taskId, completed: checked });
  }

  submitQuickAdd(): void {
    const title = this.quickTitle().trim();
    if (!title) return;
    this.quickTaskAdded.emit({ title, priority: this.quickPriority() });
    this.quickTitle.set('');
  }
}
