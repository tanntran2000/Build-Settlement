const original=new URL('./profile-end-week.mjs',import.meta.url);
const derived=new URL('./profile-end-week-cold-audit.mjs',import.meta.url);
const fs=await import('node:fs/promises');
let source=await fs.readFile(original,'utf8');
const inspectorStart=source.indexOf('const inspector = new Session();');
const inspectorEnd=source.indexOf("await inspector.post('Profiler.enable');")+ "await inspector.post('Profiler.enable');".length;
const imports=source.indexOf('const apis = await');
if (!(imports>=0 && inspectorStart>imports && inspectorEnd>inspectorStart)) throw Error('Profile runner anchors changed');
const setup=source.slice(inspectorStart,inspectorEnd);
source=source.slice(0,inspectorStart)+source.slice(inspectorEnd);
source=source.slice(0,imports)+setup+"\nassert(audit, 'The cold audit only accepts --audit.');\nawait inspector.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });\n"+source.slice(imports);
source=source.replace("  await inspector.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });",
  "  await inspector.post('Profiler.takePreciseCoverage');");
source=source.replace("  await inspector.post('Profiler.stopPreciseCoverage');", "");
source=source.replace("    assert.equal(hash(profiledEndWeek(apis[i], structuredClone(state))), expected[i]);", "");
source=source.replace("society-week)\\.ts", "society-week|world\\/npc|world\\/npc-household|world\\/npc-life|character\\/validate|domain\\/canonical-state|trial\\/crime)\\.ts");
source=source.replace("name: fn.functionName, ranges:", "name: fn.functionName, blockCoverage: fn.isBlockCoverage, ranges:");
source=source.replace("      row.calls++","      row.calls++");
source=source.replace("row.jsonBytes += Buffer.byteLength(JSON.stringify(value) ?? '');",
`const json = JSON.stringify(value) ?? '';
    row.jsonBytes += Buffer.byteLength(json);
    row.payloadChain = sha((row.payloadChain ?? '') + sha(json));`);
source=source.replace("inspector.disconnect();", "await inspector.post('Profiler.stopPreciseCoverage');\ninspector.disconnect();");
await fs.writeFile(derived,source,'utf8');
