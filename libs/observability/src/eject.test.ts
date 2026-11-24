import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("eject", () => {
  it("copies observability when extracting auth", () => {
    const destination = mkdtempSync(join(tmpdir(), "swiss-eject-"));
    const root = join(import.meta.dirname, "../../..");
    execFileSync("node", ["tools/scripts/eject.mjs", "auth", destination], { cwd: root });
    expect(existsSync(join(destination, "libs/observability/package.json"))).toBe(true);
    expect(existsSync(join(destination, "apps/auth/package.json"))).toBe(true);
  });
});
