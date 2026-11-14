import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
const file='packages/ui/src/EquipmentView.svelte';
const source=fs.readFileSync(file,'utf8'),normalized=source.replaceAll('\r\n','\n');
const player=normalized.match(/<svg role="img" aria-label="Character silhouette"[\s\S]*?<\/svg>/)?.[0];
const svg=`<svg role="img" aria-label="NPC silhouette" viewBox="0 0 100 200">
    <path fill-rule="evenodd" d="M55.6 20.3C52.8 17.4 50.6 16.9 48.7 16.9C43.7 16.9 40.5 18.4 38.4 21.5C37.1 23.4 37.6 25.3 35.3 28.4C33.3 30.4 31.7 32.2 32.4 35.8C32.8 37.8 34.4 39.4 33.2 41.7C31.1 44 29.9 45.6 30.5 47.7C31.1 50.3 33.2 51.7 35.8 50.5C31.7 51.4 30 53.7 27.8 56.3L16.9 70.8C15.8 72.3 16.4 73.7 17.6 75.3C21.4 81.5 26.3 87.1 30.5 90.8C31.7 91.8 32.8 91.6 34.2 91.5C31.3 95 29.7 99.4 29.7 103.8C29.7 109.3 32.4 114.6 35 121.5C37 126.9 40.4 134.4 40.6 138.2C40.9 142.5 38.7 145.7 39.2 151.8C39.7 157.7 42.4 165.8 43.6 171.9C44.3 176.1 45 179.5 43.8 182C43 183.5 42.3 184.5 42.3 185.3C42.4 186.8 45.8 187.1 48.1 186.9C49.4 186.8 49.9 186.4 49.9 185C49.9 182.1 49 177 48.8 172.7C48.6 166.7 48.3 163.2 49 158.7C49.8 153.2 49.5 148.2 48.8 143.4C48.4 140.8 48.7 138.7 48.9 136.2C49.5 131.9 49 127.1 49 122.1C49 115 48.9 110.7 49.3 108.8C49.5 108 49.7 107.9 49.9 107.8C50.9 109.5 50.9 113.7 50.8 119.1C50.7 125.5 50.9 131.5 51.2 136.2C51.4 139.5 51.3 141.9 51 144.1C50.4 149.6 50.2 152.5 50.2 156.1C50.4 161.5 50.8 164.6 50.9 168.4C51 175.7 49.9 181.4 50.2 185.5C50.3 187.1 53.9 187.1 56.6 186.5C58.5 186.1 57.9 184.8 57.3 183.9C55.6 181.9 55.3 179.4 55.4 177.1C55.8 171.9 56.5 167.3 58.1 161.8C59.9 156 61.1 152.3 60.8 148.5C60.6 144 58.9 141.2 59.2 137.2C59.7 131.2 62.4 124.7 64.7 119C68.1 111.6 70.1 107.7 70.1 103.5C70.1 99.4 68.4 95.1 65.9 91.6C67.7 91.9 69 91.2 70.2 90C74.7 85.7 79.9 79.3 82.9 74.4C83.9 72.9 83.5 71.7 82.5 70.3L71 56.7C68.2 53.4 66.6 51.6 63.8 51C65.8 51.3 67.1 51.3 68.3 49.7C70.2 47 68.1 44 66.6 42.3C65.1 40 65.6 38.8 66.3 36.9C67.5 32.4 64.6 31.4 63.4 29.1C62 26.3 62.6 23.1 59.6 21.3C58.3 20.5 56.9 20.2 55.6 20.3Z
     M38 54C36.9 58 34.5 59.6 33.8 63C32.8 67.6 34.5 70.7 38.9 72.8C40.8 75.4 41.7 78.6 41.4 80.6C41.2 82.5 40.1 84.1 38.7 85.3C36.5 84.6 34.5 85.8 33 86.5L23.7 72.3L33.5 61.6C35.6 58.9 37 56.6 38 54Z
     M65.1 61.2L76.2 72.2L67 86.5C65.3 86.3 63.3 84.5 61.1 85.1C59.3 83 58.2 81.8 58.2 79.5C58.2 77.2 59.3 74.7 60.5 73.2C65.8 70.8 66.8 67.2 65.1 61.2Z"/>
    <path fill="#d9c499" d="M52.3 23.3C55 24.1 57 26.4 58.4 29.7C59.4 32.1 61.8 32.6 62.9 35.1C64.1 37.9 62.9 40 62.2 41.3C63.6 39.9 64.7 36.3 63.2 34C61.7 31.5 59.7 31.7 58.9 28.6C57.5 25.3 55.5 23.7 52.3 23.3Z
     M39.1 28.7C38.5 31.1 34.6 32.5 35 36.8C34 33.5 35.9 31.2 37.4 30.2C38.2 29.7 38.7 29.2 39.1 28.7Z
     M37 41.2C36.9 44.6 33.7 46.2 35.1 49.2L36.8 50.7C34.4 50.5 33.8 48.4 34.7 46.7C35.8 44.7 36.6 43.9 37 41.2Z"/>
    <path fill="none" stroke="#d9c499" stroke-width=".7" stroke-linecap="round" d="M39.3 34.5C39.3 39.7 42.2 43.4 45.3 45.2C46.3 49.2 42.7 50.2 39.7 50.8M60 35C59.1 40.2 57.5 43 54.2 45.2C53.7 48.5 55.6 50 57.6 50.8"/>
   </svg>`;
if(Buffer.byteLength(svg)>=6000)throw Error('Trace must be under 6 KB');
const before=normalized.match(/<svg role="img" aria-label="NPC silhouette"[\s\S]*?<\/svg>/)?.[0];
if(!before||!player)throw Error('Missing NPC or Player anchor');
const after=normalized.replace(before,svg);
if(after.match(/<svg role="img" aria-label="Character silhouette"[\s\S]*?<\/svg>/)?.[0]!==player)throw Error('Player changed');
fs.writeFileSync(file,source.includes('\r\n')?after.replaceAll('\n','\r\n'):after,'utf8');
fs.writeFileSync(root+'silhouette/npc-trace.svg',svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" fill="#756248" opacity=".65" '),'utf8');
fs.writeFileSync(root+'silhouette/trace-metadata.json',JSON.stringify({UTC:new Date().toISOString(),base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),reference:'owner-npc-silhouette-reference.webp',referenceSha256:createHash('sha256').update(fs.readFileSync(root+'owner-npc-silhouette-reference.webp')).digest('hex'),method:'Hand-placed cubic Bezier points in the 100 × 200 reference coordinate space; arm openings use evenodd fill; two face lines and the reference hair gaps use parchment knockouts',markupBytes:Buffer.byteLength(svg),limitBytes:6000,playerUnchanged:true,testAssertionsUnchanged:true,ownerDecisions:['hợp lý rồi','Builder traces it','Rerun, no timeout change (Recommended)']},null,2)+'\n','utf8');
console.log('Traced NPC SVG: '+Buffer.byteLength(svg)+' bytes; Player SVG unchanged.');
