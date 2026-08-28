import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("accounts rows expose account-detail navigation without removing row actions", () => {
  const source = fs.readFileSync(new URL("./app/accounts/page.tsx", import.meta.url), "utf8");
  assert.match(source, /className="account-row"/);
  assert.match(source, /`\/accounts\/\$\{account\.id\}`/);
  assert.match(source, /sync\(account\.id\)/);
  assert.match(source, /disconnect\(account\.id\)/);
  const navigation = fs.readFileSync(new URL("../../packages/shared/dist/index.js", import.meta.url), "utf8");
  assert.match(navigation, /\["AI Studio", "\/ai-studio"\]/);
  assert.match(navigation, /\["Content", "\/content"\]/);
  assert.match(navigation, /\["Calendar", "\/calendar"\]/);
  assert.equal(fs.existsSync(new URL("./app/content/page.tsx", import.meta.url)), true);
  const aiStudio = fs.readFileSync(new URL("./app/ai-studio/page.tsx", import.meta.url), "utf8");
  assert.match(aiStudio, /\/api\/ai\/drafts/);
  assert.match(aiStudio, /Send to Content Library/);
  const api = fs.readFileSync(new URL("../../apps/api/src/index.ts", import.meta.url), "utf8");
  assert.match(api, /\/api\/content\/from-draft\/:draftId/);
  assert.match(api, /sourceDraftId/);
  assert.equal(fs.existsSync(new URL("./app/dashboard/page.tsx", import.meta.url)), true);
  assert.equal(fs.existsSync(new URL("./app/calendar/page.tsx", import.meta.url)), true);
});
