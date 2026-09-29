import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function getAllTsFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== "dist" && file !== "__tests__") {
        results = results.concat(getAllTsFiles(filePath));
      }
    } else if (file.endsWith(".ts")) {
      results.push(filePath);
    }
  }
  return results;
}

export function scanSourceForViolations(content: string, forbiddenPatterns: RegExp[]): string[] {
  const violations: string[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignore comments
    if (line.trim().startsWith("//") || line.trim().startsWith("/*")) continue;
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(line)) {
        violations.push(`Line ${i + 1}: matches ${pattern.toString()} -> '${line.trim()}'`);
      }
    }
  }
  return violations;
}

describe("Architectural Boundaries (LAW-02)", () => {
  const coreSrcDir = path.resolve(__dirname, "../");
  const simulationSrcDir = path.resolve(__dirname, "../../../simulation/src");


  it("ensures packages/core never imports simulation or DOM/browser globals", () => {
    const files = getAllTsFiles(coreSrcDir);
    expect(files.length).toBeGreaterThan(0);

    const forbiddenInCore = [
      /@haven\/simulation/,
      /\.\.\/.*simulation/,
      /\bdocument\b/,
      /\bwindow\b/,
      /\bHTMLElement\b/,
      /@haven\/ui/,
      /svelte/,
    ];

    const allViolations: { file: string; violations: string[] }[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const v = scanSourceForViolations(content, forbiddenInCore);
      if (v.length > 0) {
        allViolations.push({ file: path.basename(file), violations: v });
      }
    }

    expect(allViolations).toEqual([]);
  });

  it("ensures packages/simulation never imports UI or DOM/browser globals", () => {
    const files = getAllTsFiles(simulationSrcDir);
    expect(files.length).toBeGreaterThan(0);

    const forbiddenInSimulation = [
      /@haven\/ui/,
      /\.\.\/.*ui/,
      /\bdocument\b/,
      /\bwindow\b/,
      /\bHTMLElement\b/,
      /svelte/,
    ];

    const allViolations: { file: string; violations: string[] }[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const v = scanSourceForViolations(content, forbiddenInSimulation);
      if (v.length > 0) {
        allViolations.push({ file: path.basename(file), violations: v });
      }
    }

    expect(allViolations).toEqual([]);
  });

  it("verifies that the scanner actively detects forbidden imports on synthetic violations", () => {
    const fakeCoreWithSimulation = `
      import { Settlement } from "./settlement.js";
      import { simulateDailyEconomy } from "@haven/simulation";
      export const x = 1;
    `;
    const v1 = scanSourceForViolations(fakeCoreWithSimulation, [/@haven\/simulation/]);
    expect(v1.length).toBe(1);
    expect(v1[0]).toContain("@haven/simulation");

    const fakeCoreWithDOM = `
      export function alertUser() {
        window.alert("danger");
      }
    `;
    const v2 = scanSourceForViolations(fakeCoreWithDOM, [/\bwindow\b/]);
    expect(v2.length).toBe(1);
    expect(v2[0]).toContain("window");
  });
});
