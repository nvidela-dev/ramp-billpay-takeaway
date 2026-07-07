export interface LlmExtractionResult<T> {
  data: T;
  confidence?: number;
  warnings?: string[];
  rawTextNotes?: string;
}
