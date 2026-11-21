import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document.model';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css']
})
export class DocumentListComponent implements OnInit {
  documents = signal<Document[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Filters
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedDepartment = signal<string>('all');

  filteredDocuments = computed(() => {
    const list = this.documents();
    const query = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatus();
    const dept = this.selectedDepartment();

    return list.filter((doc) => {
      // Search matching: id, title, content, author, caseNumber, tags
      const caseNum = (doc.metadata?.numerSprawy || doc.metadata?.caseNumber || '').toLowerCase();
      const applicant = (doc.metadata?.wnioskodawca || doc.metadata?.applicant || doc.author || '').toLowerCase();
      const title = (doc.title || '').toLowerCase();
      const content = (doc.content || '').toLowerCase();
      const tags = (doc.tags || []).join(' ').toLowerCase();

      const matchesQuery = !query ||
        title.includes(query) ||
        content.includes(query) ||
        applicant.includes(query) ||
        caseNum.includes(query) ||
        tags.includes(query) ||
        doc.id === query;

      // Status matching
      const docStatus = (doc.metadata?.status || 'nowy').toLowerCase();
      const matchesStatus = status === 'all' || docStatus === status;

      // Department matching
      const docDept = (doc.metadata?.department || '').toLowerCase();
      const matchesDept = dept === 'all' || docDept === dept.toLowerCase();

      return matchesQuery && matchesStatus && matchesDept;
    });
  });

  // Statistics
  totalCount = computed(() => this.documents().length);
  answeredCount = computed(() =>
    this.documents().filter((d) => (d.metadata?.status || '').toLowerCase() === 'odpowiedziano').length
  );
  pendingCount = computed(() =>
    this.documents().filter((d) => (d.metadata?.status || '').toLowerCase() !== 'odpowiedziano').length
  );

  departments = computed(() => {
    const depts = new Set<string>();
    for (const doc of this.documents()) {
      if (doc.metadata?.department) {
        depts.add(doc.metadata.department);
      }
    }
    return Array.from(depts);
  });

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.documentService.getDocuments().subscribe({
      next: (data) => {
        this.documents.set(data);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  getCaseNumber(doc: Document): string {
    return doc.metadata?.numerSprawy || doc.metadata?.caseNumber || `ID: ${doc.id}`;
  }

  getApplicant(doc: Document): string {
    return doc.metadata?.wnioskodawca || doc.metadata?.applicant || doc.author || 'Anonim';
  }

  getStatusBadgeClass(status?: string): string {
    const s = (status || 'nowy').toLowerCase();
    if (s === 'odpowiedziano' || s === 'zrealizowane') return 'badge-success';
    if (s === 'w toku' || s === 'w trakcie') return 'badge-warning';
    if (s === 'przeterminowane') return 'badge-danger';
    return 'badge-info';
  }
}
