import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
it.each(readdirSync(new URL('./fixtures/society-v6/',import.meta.url)))('preserves v6 gameplay in %s', file => {
 const read=(v:number)=>readFileSync(new URL(`./fixtures/society-v${v}/${file}`,import.meta.url),'utf8');
 expect(JSON.parse(read(7).replaceAll('tile-society-07','tile-society-06'))).toEqual(JSON.parse(read(6)));
});
