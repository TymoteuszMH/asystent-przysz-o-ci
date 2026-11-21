export interface Document {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, unknown>;
}
