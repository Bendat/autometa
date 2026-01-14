import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outDir = path.join(root, "coverage");

const summaryFiles = globSync("**/coverage-summary.json", {
  cwd: root,
  ignore: ["coverage/**", "**/node_modules/**", "**/.turbo/**"],
});

const finalFiles = globSync("**/coverage-final.json", {
  cwd: root,
  ignore: ["coverage/**", "**/node_modules/**", "**/.turbo/**"],
});

const mergeTotals = (totals, add) => {
  for (const key of Object.keys(add)) {
    const current = totals[key] ?? { total: 0, covered: 0, skipped: 0, pct: 100 };
    const next = add[key];
    const merged = {
      total: current.total + (next.total ?? 0),
      covered: current.covered + (next.covered ?? 0),
      skipped: current.skipped + (next.skipped ?? 0),
    };
    merged.pct = merged.total === 0 ? 100 : (merged.covered / merged.total) * 100;
    totals[key] = merged;
  }
};

const mergedSummary = { total: {} };
for (const file of summaryFiles) {
  const fullPath = path.join(root, file);
  const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  if (data.total) {
    mergeTotals(mergedSummary.total, data.total);
  }
  for (const [filePath, stats] of Object.entries(data)) {
    if (filePath === "total") continue;
    mergedSummary[filePath] = stats;
  }
}

const mergedFinal = {};
for (const file of finalFiles) {
  const fullPath = path.join(root, file);
  const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  for (const [filePath, stats] of Object.entries(data)) {
    const current = mergedFinal[filePath];
    if (!current) {
      mergedFinal[filePath] = stats;
      continue;
    }
    mergedFinal[filePath] = {
      ...stats,
      s: mergeStatMaps(current.s, stats.s),
      b: mergeStatMaps(current.b, stats.b),
      f: mergeStatMaps(current.f, stats.f),
      l: mergeStatMaps(current.l, stats.l),
    };
  }
}

function mergeStatMaps(a = {}, b = {}) {
  const out = { ...a };
  for (const [key, value] of Object.entries(b)) {
    out[key] = (out[key] ?? 0) + value;
  }
  return out;
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Recompute pct for merged totals
for (const metric of Object.values(mergedSummary.total)) {
  metric.pct = metric.total === 0 ? 100 : (metric.covered / metric.total) * 100;
}

fs.writeFileSync(path.join(outDir, "coverage-summary.json"), JSON.stringify(mergedSummary, null, 2));
fs.writeFileSync(path.join(outDir, "coverage-final.json"), JSON.stringify(mergedFinal, null, 2));

console.log(`Merged ${summaryFiles.length} summary files and ${finalFiles.length} final files into coverage/`);