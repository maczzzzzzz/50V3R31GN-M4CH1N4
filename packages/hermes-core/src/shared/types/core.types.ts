export type Namespace = 'core_rules' | 'research' | 'audit' | 'session';

export interface PdfChunk {
  content: string;
  sourceFile: string;
  pageStart: number;
  pageEnd: number;
}

export interface RagMatch extends PdfChunk {
  namespace: string;
  contextType: 'lore' | 'rule' | 'audit';
  capabilityReq: string;
  sourceRef: string;
  sectionHeading?: string;
  score: number;
}

export interface RagQueryResult {
  query: string;
  matches: RagMatch[];
}

export interface NodeAError {
  error: string;
  traceId: string;
}
