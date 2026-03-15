import { AuditResult } from "@/types/audit";
import puppeteer from "puppeteer";
import { readFileSync } from "fs";
import { resolve } from "path";
import lighthouse from "lighthouse";

export async function audit(url: string): Promise<AuditResult> {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    // wait until there are fewer than 2 active network requests for at least 500ms
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

    const screenshotBuffer = await page.screenshot({
      encoding: "base64",
      fullPage: false,
    });
    const screenshot = `data:image/png;base64,${screenshotBuffer}`;

    // axe-core
    const axeSource = readFileSync(
      resolve(process.cwd(), "node_modules/axe-core/axe.js"),
      "utf8",
    );
    await page.addScriptTag({ content: axeSource });

    const axeResults = await page.evaluate(async () => {
      return await (window as any).axe.run(document, {
        runOnly: ["wcag2a", "wcag2aa", "best-practice"],
      });
    });

    const issues = (axeResults as any).violations.flatMap((violation: any) =>
      violation.nodes.slice(0, 3).map((node: any) => ({
        rule: violation.id,
        severity:
          violation.impact === "critical" || violation.impact === "serious"
            ? "critical"
            : violation.impact === "moderate"
              ? "warning"
              : "info",
        element: node.target[0],
        detail: violation.description + "-" + node.failureSummary,
      })),
    );

    const criticalCount = issues.filter(
      (i: any) => i.severity === "critical",
    ).length;
    const warningCount = issues.filter(
      (i: any) => i.severity === "warning",
    ).length;
    const infoCount = issues.filter((i: any) => i.severity === "info").length;

    const accessibilityScore = Math.round(
      Math.max(0, 100 - criticalCount * 8 - warningCount * 2 - infoCount * 0.5),
    );

    const contrastCount = issues.filter(
      (i: any) => i.rule === "color-contrast",
    ).length;
    const contrastScore = Math.round(Math.max(0, 100 - contrastCount * 12));

    const typographyCount =
      (axeResults as any).incomplete?.filter(
        (v: any) => v.id.includes("color") || v.id.includes("font"),
      ).length ?? 0;
    const typographyScore = Math.round(Math.max(0, 100 - typographyCount * 5));

    // lighthouse
    const port = new URL(browser.wsEndpoint()).port;
    const lighthouseResults = await lighthouse(url, {
      port: parseInt(port),
      output: "json",
      onlyCategories: ["performance", "seo"],
      logLevel: "error",
    });

    const lhr = lighthouseResults?.lhr;
    const performanceScore = Math.round(
      (lhr?.categories?.performance?.score ?? 0) * 100,
    );
    const seoScore = Math.round((lhr?.categories?.seo?.score ?? 0) * 100);

    const auditRefs = [
      ...(lhr?.categories?.performance?.auditRefs ?? []),
      ...(lhr?.categories?.seo?.auditRefs ?? []),
    ]
      .filter((ref: any) => (ref.weight ?? 0) > 0)
      .map((ref: any) => ref.id);

    const axeRules = new Set(issues.map((i: any) => i.rule));

    const lighthouseIssues = auditRefs
      .map((id: string) => lhr?.audits?.[id])
      .filter(
        (audit: any) => audit && audit.score !== null && audit.score < 0.9,
      )
      .filter((audit: any) => !axeRules.has(audit.id))
      .map((audit: any) => ({
        rule: audit.id,
        severity:
          audit.score < 0.5 ? ("critical" as const) : ("warning" as const),
        element: audit.displayValue ?? "",
        detail: audit.description,
      }));

    const overall = Math.round(
      accessibilityScore * 0.4 +
        contrastScore * 0.2 +
        typographyScore * 0.1 +
        performanceScore * 0.2 +
        seoScore * 0.1,
    );

    return {
      url,
      screenshot,
      issues: [...issues, ...lighthouseIssues].sort((a: any, b: any) => {
        const order: Record<string, number> = {
          critical: 0,
          warning: 1,
          info: 2,
        };
        return order[a.severity] - order[b.severity];
      }),
      scores: {
        accessibility: accessibilityScore,
        contrast: contrastScore,
        typography: typographyScore,
        performance: performanceScore,
        seo: seoScore,
        overall: overall,
      },
      suggestions: [],
      summary: "",
    };
  } finally {
    await browser.close();
  }
}
