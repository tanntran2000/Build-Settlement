import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(pathToFileURL('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/package.json'));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(
    '<div data-life-view="characters"><section aria-label="Character window"><div class="profile"><div role="tabpanel">' +
    '<div role="tabpanel" aria-label="Skills"><dl><div><dt>Technical</dt><dd>65</dd></div></dl></div>' +
    '</div></div></section></div>',
  );
  const skills = page.locator('[data-life-view="characters"]').getByRole('region', { name: 'Character window', exact: true })
    .locator('.profile > [role="tabpanel"]').getByRole('tabpanel', { name: 'Skills', exact: true });
  const approved = skills.locator('dl > div').filter({ has: skills.getByText('Technical', { exact: true }) }).locator('dd');
  const proposed = skills.locator('dl > div').filter({ has: page.getByText('Technical', { exact: true }) }).locator('dd');
  const approvedMatches = await approved.count();
  const proposedMatches = await proposed.count();
  assert.equal(approvedMatches, 0);
  assert.equal(proposedMatches, 1);
  const proposedText = await proposed.innerText();
  assert.equal(proposedText, '65');
  console.log(JSON.stringify({
    utc: new Date().toISOString(), playwright: require('@playwright/test/package.json').version,
    approvedMatches, proposedMatches, proposedText,
  }, null, 2));
} finally {
  await browser.close();
}
