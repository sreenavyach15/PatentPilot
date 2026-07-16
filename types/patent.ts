export interface Patent {
  patentNumber: string;
  title: string;
  abstract: string;
  assignee: string;
  publicationDate: string;
  source: string;
  relevanceScore: number;
  confidence: number;
  aiExplanation?: string;
}