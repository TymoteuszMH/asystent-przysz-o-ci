import { Injectable, signal, computed } from '@angular/core';
import { CalendarViewMode, Task, TaskCategory, TaskPriority } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly STORAGE_KEY = 'task_calendar_pro_v1';

  private readonly tasksSignal = signal<Task[]>(this.loadTasks());
  readonly selectedDate = signal<string>(this.getTodayISO());
  readonly viewMode = signal<CalendarViewMode>('MONTH');
  readonly searchQuery = signal<string>('');
  readonly categoryFilter = signal<TaskCategory | 'ALL'>('ALL');
  readonly priorityFilter = signal<TaskPriority | 'ALL'>('ALL');
  readonly hideCompleted = signal<boolean>(false);

  readonly allTasks = this.tasksSignal.asReadonly();

  readonly filteredTasks = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.categoryFilter();
    const prio = this.priorityFilter();
    const hideDone = this.hideCompleted();

    return this.tasksSignal().filter(task => {
      if (hideDone && task.completed) return false;
      if (cat !== 'ALL' && task.category !== cat) return false;
      if (prio !== 'ALL' && task.priority !== prio) return false;
      if (q) {
        const subText = task.subtasks.map(s => s.text).join(' ');
        const hay = `${task.title} ${task.notes ?? ''} ${subText}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  readonly tasksForSelectedDate = computed(() =>
    this.filteredTasks()
      .filter(t => t.date === this.selectedDate())
      .sort((a, b) => Number(a.completed) - Number(b.completed))
  );

  readonly overdueTasksCount = computed(() => {
    const today = this.getTodayISO();
    return this.tasksSignal().filter(t => !t.completed && t.date < today).length;
  });

  addQuickTask(title: string, priority: TaskPriority = 'MEDIUM'): void {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const newTask: Task = {
      id: 't-' + Date.now(),
      title: cleanTitle,
      date: this.selectedDate(),
      priority,
      category: 'URZAD',
      completed: false,
      subtasks: []
    };
    this.tasksSignal.update(tasks => [newTask, ...tasks]);
    this.saveTasks();
  }

  toggleTaskCompletion(taskId: string, completed: boolean): void {
    this.tasksSignal.update(tasks =>
      tasks.map(t =>
        t.id === taskId
          ? { ...t, completed, subtasks: t.subtasks.map(s => ({ ...s, done: completed })) }
          : t
      )
    );
    this.saveTasks();
  }

  toggleSubtask(taskId: string, subtaskId: string, done: boolean): void {
    this.tasksSignal.update(tasks =>
      tasks.map(t => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks.map(s => (s.id === subtaskId ? { ...s, done } : s));
        const completed = subtasks.length > 0 && subtasks.every(s => s.done);
        return { ...t, subtasks, completed };
      })
    );
    this.saveTasks();
  }

  deleteTask(taskId: string): void {
    this.tasksSignal.update(tasks => tasks.filter(t => t.id !== taskId));
    this.saveTasks();
  }

  rolloverOverdueTasks(): void {
    const today = this.getTodayISO();
    this.tasksSignal.update(tasks =>
      tasks.map(t => (!t.completed && t.date < today ? { ...t, date: today } : t))
    );
    this.selectedDate.set(today);
    this.saveTasks();
  }

  exportToJson(): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.tasksSignal(), null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'zadania_eksport.json';
    a.click();
  }

  getTodayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private loadTasks(): Task[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignoruj błędy localStorage
    }
    return [];
  }

  private saveTasks(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasksSignal()));
    } catch {
      // Ignoruj błędy localStorage
    }
  }
}
