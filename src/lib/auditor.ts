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

    const issues = (axeResults as any).violations.flatMap((violation) =>
      violation.nodes.slice(0, 3).map((node) => ({
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
      (i) => i.severity === "critical",
    ).length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    const infoCount = issues.filter((i) => i.severity === "info").length;

    const accessibilityScore = Math.round(
      Math.max(0, 100 - criticalCount * 8 - warningCount * 2 - infoCount * 0.5),
    );

    const contrastCount = issues.filter(
      (i) => i.rule === "color-contrast",
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
      issues: issues,
      scores: {
        accessibility: accessibilityScore,
        contrast: contrastScore,
        typography: typographyScore,
        performance: performanceScore,
        seo: seoScore,
        overall: overall,
      },
      summary: "",
    };
  } finally {
    await browser.close();
  }
}
