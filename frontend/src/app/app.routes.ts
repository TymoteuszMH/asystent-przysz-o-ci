import { Routes } from '@angular/router';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { DocumentDetailComponent } from './components/document-detail/document-detail.component';
import { TaskCalendarComponent } from './task-calendar/task-calendar.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'documents',
    pathMatch: 'full'
  },
  {
    path: 'documents',
    component: DocumentListComponent
  },
  {
    path: 'documents/new',
    loadComponent: () => import('./components/document-create/document-create.component').then(module => module.DocumentCreateComponent)
  },
  {
    path: 'documents/:id',
    component: DocumentDetailComponent
  },
  {
    path: 'calendar',
    component: TaskCalendarComponent
  },
  {
    path: '**',
    redirectTo: 'documents'
  }
];
