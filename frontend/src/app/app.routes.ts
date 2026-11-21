import { Routes } from '@angular/router';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { DocumentDetailComponent } from './components/document-detail/document-detail.component';
import { DocumentCreateComponent } from './components/document-create/document-create.component';

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
    component: DocumentCreateComponent
  },
  {
    path: 'documents/:id',
    component: DocumentDetailComponent
  },
  {
    path: '**',
    redirectTo: 'documents'
  }
];
