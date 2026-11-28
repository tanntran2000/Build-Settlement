import assert from 'node:assert/strict';

function replace(source, anchor, replacement) {
  assert.equal(source.split(anchor).length, 2, anchor);
  return source.replace(anchor, () => replacement);
}

const timed = (key, statement) =>
  'const time_' + key + ' = process.hrtime.bigint();\n' + statement +
  '\nglobalThis.mansionTimings.' + key + ' = Number(process.hrtime.bigint() - time_' + key + ');';

export function instrumentMansionSource(url, source) {
  if (url.endsWith('/character-life-command.ts')) {
    const quote = "const terms = type === 'END_WEEK' ? mansionTerms(world) : undefined;";
    const report = 'if (mansion) report = Object.freeze({ ...report, mansion: runMansionWeek(next.npcs, mansion) });';
    const opening = 'const rosterChanged = householdWeek.leftIds.size > 0 ||';
    const closing = 'const closingTerms = rosterChanged ? mansionTerms(next) : mansion?.terms;';
    return replace(replace(replace(replace(source, quote, timed('openingQuote', quote)), report,
      'if (mansion) {\nconst mansionReport = runMansionWeek(next.npcs, mansion);\n' +
      timed('reportAssembly', 'report = Object.freeze({ ...report, mansion: mansionReport });') + '\n}'),
    opening, 'const time_closingTerms = process.hrtime.bigint();\n' + opening), closing, closing +
      '\nglobalThis.mansionTimings.closingTerms = Number(process.hrtime.bigint() - time_closingTerms);' +
      '\nglobalThis.mansionTimings.rebuilt = rosterChanged;');
  }
  if (url.endsWith('/tile-trial-week.ts')) {
    const receipt = "charge.paid = stocks.gold >= due;\n      if (fundedAfterTheft !== undefined && charge.paid !== fundedAfterTheft) throw Error('Mansion funding changed before upkeep.');";
    const early = 'const mansionAuthority = mansion && (() => {';
    const order = 'const order = resolveOrderWeek(';
    return replace(replace(replace(source, receipt, timed('b1Receipt', receipt)), early,
      'const time_funding = process.hrtime.bigint();\n' + early), order,
      'globalThis.mansionTimings.earlyFunding = Number(process.hrtime.bigint() - time_funding);\n' + order);
  }
  return source;
}
