export type Severity = "critical" | "warning" | "info";

export interface Issue {
  rule: string;
  severity: Severity;
  detail: string;
  element: string;
}

export interface AuditResult {
  url: string;
  screenshot: string;
  issues: Issue[];
  scores: {
    accessibility: number;
    contrast: number;
    typography: number;
    overall: number;
  };
  summary: string;
}
