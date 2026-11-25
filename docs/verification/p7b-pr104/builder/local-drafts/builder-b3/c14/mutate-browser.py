from pathlib import Path
import subprocess
import sys
import os

file = Path('tests/e2e/acquisition.spec.ts')
evidence = Path(__file__).parent
baseline = file.read_bytes()
s = baseline.decode('utf-8')
def replace(old, new):
    global s
    assert s.count(old) == 1, old
    s = s.replace(old, new)

# Probe only the rendered outputs at the checkpoint where their specific literal assertions run.
replace("    await expect(guild.getByRole('article').locator('p')).toHaveText([",
"""    await first.locator('p').nth(3).evaluate(el => { el.textContent = 'Beauty 99 · Mind 70 · Obedience 63'; });
    await expect.soft(guild.getByRole('article').locator('p')).toHaveText([""")
replace("    await expect(rivals.getByRole('listitem')).toHaveText([\n      'Thesara Reedmark · Cautious · Out'",
"""    await rivals.getByRole('listitem').last().evaluate(el => el.remove());
    await expect.soft(rivals.getByRole('listitem')).toHaveText([
      'Thesara Reedmark · Cautious · Out'""")
replace("    await expect(bidLog.getByRole('listitem')).toHaveText([",
"""    await bidLog.getByRole('listitem').nth(2).evaluate(el => el.remove());
    await bidLog.getByRole('listitem').nth(1).evaluate(el => el.remove());
    await expect.soft(bidLog.getByRole('listitem')).toHaveText([""")
replace("    await expect(page.getByRole('region', { name: 'Household activity' }).getByRole('listitem')).toHaveText([",
"""    const rows = page.getByRole('region', { name: 'Household activity' }).getByRole('listitem');
    await rows.nth(1).evaluate(el => { el.textContent = 'Lot sold to a rival · Auction House · 1 Gold'; });
    await expect.soft(rows).toHaveText([""")
replace("    expect(markers).toStrictEqual(['inside', 'inside']);", "    void markers; // Separate P3-1 RED observed in the normal browser run.")

env = dict(os.environ, CI='1')
try:
    file.write_bytes(s.encode('utf-8'))
    result = subprocess.run([sys.executable, str(evidence/'run.py'), 'red-probe-p1-3-browser',
                             'node', 'node_modules/@playwright/test/cli.js', 'test', file.as_posix(), '-g', 'at 1280px',
                             '--output', str(evidence/'red-probe-browser-artifacts')], env=env, check=False)
    output = (evidence/'red-probe-p1-3-browser.txt').read_text(encoding='utf-8')
    assert result.returncode == 1 and '1 failed' in output
    assert output.count('Error: expect(locator).toHaveText(expected) failed') == 4, 'did not reach all four probes'
    for fragment in ('Beauty 99', 'Ivrayne Copperfen', 'Edris Thornwold bids 55 Gold.', 'Auction House · 1 Gold'):
        assert fragment in output, fragment
finally:
    file.write_bytes(baseline)
print('All four seeded browser mutations caught. Original test bytes restored.', flush=True)
