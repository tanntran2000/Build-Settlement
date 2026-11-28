const cp = require('node:child_process');
const source = cp.execFileSync('git', ['log', '--no-color', '--format=commit %H', '-p', 'origin/main..HEAD'], {encoding:'utf8', maxBuffer:32*1024*1024});
const forms = [
  ['private key marker', /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['API token', /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{24,}|AIza[0-9A-Za-z_-]{35})\b/],
  ['Slack access token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ['credential literal', /\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*['"][A-Za-z0-9_/\u002b=\-.]{18,}['"]/i],
];
let file = '', additions = 0, found = 0;
for (const line of source.split(/\r?\n/)) {
  if (line.startsWith('+++ b/')) { file = line.slice(6); continue; }
  if (!line.startsWith('+')) continue;
  additions++;
  for (const [kind, pattern] of forms) if (pattern.test(line)) {
    found++;
    console.log(kind + ' in ' + file);
  }
}
console.log('Scanned ' + additions + ' added lines across all R1 commits. Candidate matches: ' + found + '.');
process.exitCode = found ? 1 : 0;
