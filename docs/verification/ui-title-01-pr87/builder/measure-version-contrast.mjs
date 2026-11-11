import fs from 'node:fs';
import crypto from 'node:crypto';
const css=fs.readFileSync('packages/ui/src/ledger-theme.css','utf8');
const component=fs.readFileSync('packages/ui/src/TitleScreen.svelte','utf8');
const tokens=Object.fromEntries([...css.matchAll(/--([\w-]+):\s*#([\da-f]{6})/gi)].map(m=>[m[1],m[2]]));
function luminance(hex) { const c=hex.match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4); return c[0]*.2126+c[1]*.7152+c[2]*.0722; }
const foreground=tokens['wax-text'], background=tokens['wood-dark'];
const a=luminance(foreground),b=luminance(background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
const result={ recordedUtc:new Date().toISOString(), method:'WCAG relative luminance from delivered CSS tokens. TitleScreen declares color var(--wax-text) and version background var(--wood-dark).', foreground:'#'+foreground,background:'#'+background,foregroundLuminance:a,backgroundLuminance:b,ratio,minimum:4.5,pass:ratio>=4.5,sourceSha256:{'ledger-theme.css':crypto.createHash('sha256').update(css).digest('hex'),'TitleScreen.svelte':crypto.createHash('sha256').update(component).digest('hex')},rules:component.split('\n').filter(line=>line.includes('.title-screen {')||line.includes('.version {')) };
fs.writeFileSync('C:/Users/Admin/.t3/local-drafts/ui-title-01-prA/version-contrast-measurement.json',JSON.stringify(result,null,2)); console.log(JSON.stringify(result,null,2)); if(!result.pass)process.exit(1);
