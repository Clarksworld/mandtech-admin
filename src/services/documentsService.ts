import { apiRequest } from './api';
import { TechnicalDocument } from './types';

export interface DocumentsResponse {
  data: TechnicalDocument[];
  total: number;
}

export async function fetchDocuments(): Promise<DocumentsResponse> {
  return apiRequest<DocumentsResponse>('/api/documents');
}
