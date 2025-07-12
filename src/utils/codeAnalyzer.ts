export interface CodeIssue {
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
}

export interface CodeMetrics {
  linesOfCode: number;
  commentLines: number;
  complexity: number;
}

/**
 * Basic VB6 code analyzer generating metrics and simple issues.
 */
export function analyzeVB6Code(code: string): { issues: CodeIssue[]; metrics: CodeMetrics } {
  const lines = code.split(/\r?\n/);
  const issues: CodeIssue[] = [];
  let commentLines = 0;
  let complexity = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("'") || trimmed === '') {
      if (trimmed.startsWith("'")) commentLines++;
      return;
    }

    if (/\bGoTo\b/i.test(trimmed)) {
      issues.push({
        line: index + 1,
        message: 'Avoid GoTo statements',
        severity: 'warning',
        code: 'VB005'
      });
    }

    const complexityKeywords = [/\bIf\b/i, /\bFor\b/i, /\bWhile\b/i, /\bDo\b/i, /\bSelect\s+Case\b/i];
    if (complexityKeywords.some(re => re.test(trimmed))) {
      complexity++;
    }
  });

  if (!/^\s*Option\s+Explicit/i.test(lines[0] || '')) {
    issues.push({
      line: 1,
      message: 'Option Explicit is recommended',
      severity: 'info',
      code: 'VB006'
    });
  }

  return {
    issues,
    metrics: {
      linesOfCode: lines.length,
      commentLines,
      complexity
    }
  };
}
