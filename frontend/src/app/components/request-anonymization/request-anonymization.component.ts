import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { AnonymizationSuggestion, RequestAnonymizationFields } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-request-anonymization',
  standalone: true,
  templateUrl: './request-anonymization.component.html',
  styleUrl: './request-anonymization.component.css',
})
export class RequestAnonymizationComponent implements OnChanges, OnDestroy {
  @Input() title = '';
  @Input() content = '';
  @Input() applicant?: string;
  @Input() disabled = false;
  @Output() applied = new EventEmitter<RequestAnonymizationFields>();

  suggestions: AnonymizationSuggestion[] = [];
  selected = new Set<string>();
  phrase = '';
  preview?: RequestAnonymizationFields;
  message = '';
  isScanning = false;
  private scan?: Subscription;

  constructor(private readonly documentService: DocumentService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['title'] && !changes['content'] && !changes['applicant']) return;
    this.scan?.unsubscribe();
    this.isScanning = false;
    this.suggestions = [];
    this.selected.clear();
    this.preview = undefined;
    this.message = '';
    this.phrase = '';
  }

  ngOnDestroy(): void {
    this.scan?.unsubscribe();
  }

  get source(): RequestAnonymizationFields {
    return { title: this.title, content: this.content, applicant: this.applicant };
  }

  get isReviewPending(): boolean {
    return this.isScanning || !!this.preview;
  }

  get hasText(): boolean {
    return !!(this.title.trim() || this.content.trim() || this.applicant?.trim());
  }

  findSuggestions(): void {
    this.isScanning = true;
    this.message = '';
    this.scan = this.documentService.checkSensitiveData(this.source).subscribe({
      next: suggestions => {
        for (const suggestion of suggestions) {
          if (this.suggestions.some(item => item.value === suggestion.value)) continue;
          this.suggestions.push(suggestion);
          this.selected.add(suggestion.value);
        }
        this.refreshPreview();
        this.isScanning = false;
        this.message = suggestions.length
          ? 'Sprawdź sugestie i wybierz dane do ukrycia.'
          : 'Nie znaleziono sugestii. Możesz wskazać fragment ręcznie.';
      },
      error: (error: Error) => {
        this.isScanning = false;
        this.message = error.message;
      }
    });
  }

  addPhrase(): void {
    const value = this.phrase.trim();
    if (!value) return;
    if (![this.title, this.content, this.applicant].some(text => text?.includes(value))) {
      this.message = 'Tego fragmentu nie ma w temacie, treści ani danych wnioskodawcy.';
      return;
    }

    if (!this.suggestions.some(item => item.value === value)) {
      this.suggestions.push({ value, label: 'Fragment wskazany ręcznie' });
    }
    this.toggle(value, true);
    this.message = '';
    this.phrase = '';
  }

  toggle(value: string, checked: boolean): void {
    if (checked) this.selected.add(value);
    else this.selected.delete(value);
    this.refreshPreview();
  }

  apply(): void {
    if (this.disabled || this.isScanning || !this.hasText) return;
    this.applied.emit(this.preview ?? this.source);
  }

  private refreshPreview(): void {
    if (!this.selected.size) {
      this.preview = undefined;
      return;
    }

    const mask = (text: string) => {
      const ranges: { start: number; end: number }[] = [];
      for (const fragment of this.selected) {
        let start = text.indexOf(fragment);
        while (start !== -1) {
          ranges.push({ start, end: start + fragment.length });
          start = text.indexOf(fragment, start + fragment.length);
        }
      }
      ranges.sort((a, b) => a.start - b.start);
      let result = '';
      let end = 0;
      for (const range of ranges) {
        if (range.start >= end) {
          result += text.slice(end, range.start) + '[zanonimizowano]';
        }
        end = Math.max(end, range.end);
      }
      return result + text.slice(end);
    };
    this.preview = {
      title: mask(this.title),
      content: mask(this.content),
      applicant: this.applicant === undefined ? undefined : mask(this.applicant),
    };
  }
}
