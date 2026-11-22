export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskCategory = 'URZAD' | 'PISMA' | 'SPOTKANIA' | 'INNE';
export type CalendarViewMode = 'MONTH' | 'WEEK';

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  priority: TaskPriority;
  category: TaskCategory;
  notes?: string;
  completed: boolean;
  subtasks: Subtask[];
}

export interface CalendarDayCell {
  iso: string;
  dayNum: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}
