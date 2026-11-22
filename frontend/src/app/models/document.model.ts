export interface RequestAnonymizationFields {
  title: string;
  content: string;
  applicant?: string;
}

export interface AnonymizationSuggestion {
  value: string;
  label: string;
}

export interface SensitiveField {
  id: string;
  category: 'osoba' | 'email' | 'telefon' | 'adres' | 'pesel' | 'nip' | 'inne';
  label: string;
  value: string;
  replacement: string;
  startIndex: number;
  endIndex: number;
  isAnonymized: boolean;
  legalBasis?: string;
}

export interface ResponseModelResult {
  caseNumber: string;
  documentTitle: string;
  applicant: string;
  departmentName: string;
  draftResponseText: string;
  dane_podlegajace_anonimizacji: SensitiveField[];
  anonymizedPreviewText: string;
  generatedAt: string;
}

export interface RequestAnalysis {
  title: string;
  applicant: string;
  summary: string;
  issues: string[];
  keywords: string[];
}

export interface DepartmentMaterial {
  department: string;
  text: string;
}

export interface GenerateResponseDto {
  departmentFeedback: string;
  departmentName?: string;
}

export interface ApproveResponseDto {
  finalResponseText: string;
  anonymizedText?: string;
  dane_podlegajace_anonimizacji?: SensitiveField[];
  officerNote?: string;
}

export interface DepartmentRequestPlan {
  department: string;
  deadline: string;
  notes: string;
  contactEmail?: string;
  similarCases?: string[];
}

export interface DocumentMetadata {
  numerSprawy?: string;
  caseNumber?: string;
  customId?: string;
  wnioskodawca?: string;
  applicant?: string;
  przedmiotZapytania?: string;
  dataWplywu?: string;
  terminOdpowiedzi?: string;
  dataOdpowiedzi?: string;
  osobaOdpowiedzialna?: string;
  pozostaloDni?: number;
  department?: string;
  departments?: string[];
  stage?: string;
  decision?: string;
  duplikatWniosku?: { sourceId: string; caseNumber: string; responseText: string };
  prosbaOScislenie?: { text: string; date: string };
  status?: string;
  zbiezneWnioskiIds?: string[];
  rekomendowaneWydzialy?: string[];
  prosbaWyslanaDo?: string[];
  planZapytaniaDoWydzialu?: DepartmentRequestPlan;
  planyZapytanDoWydzialow?: DepartmentRequestPlan[];
  materialyWydzialow?: DepartmentMaterial[];
  odpowiedzZatwierdzona?: string;
  wersjaAnonimizowana?: string;
  dane_podlegajace_anonimizacji?: SensitiveField[];
  notatkaUrzednika?: string;
  [key: string]: unknown;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: DocumentMetadata;
}

export interface CreateDocumentDto {
  duplicateOfId?: string;
  anonymizationReviewed?: boolean;
  id?: string;
  title: string;
  content: string;
  author?: string;
  tags?: string[];
  metadata?: DocumentMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckSimilarityDto {
  title?: string;
  content: string;
  tags?: string[];
}

export interface SimilarDocumentItem {
  id: string;
  caseNumber: string;
  title: string;
  content: string;
  applicant: string;
  date: string;
  department?: string;
  status?: string;
  tags: string[];
  similarityPercentage: number;
  matchedKeywords: string[];
  daysAgo: number;
  archivedResponse?: string;
  isDuplicate?: boolean;
}

export interface DepartmentRecommendation {
  id: string;
  name: string;
  confidence: number;
  reason: string;
  isPrimary: boolean;
  contactEmail: string;
}

export interface SimilarityCheckResult {
  hasMatches: boolean;
  similarDocuments: SimilarDocumentItem[];
  suggestedDepartments: DepartmentRecommendation[];
  summary: string;
}
