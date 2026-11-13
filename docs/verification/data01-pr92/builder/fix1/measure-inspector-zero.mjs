import {createRequire} from 'node:module';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
process.env.NODE_ENV='production';
const ui=path.resolve('packages/ui'),require=createRequire(path.join(ui,'package.json'));
const vitePath=path.join(path.dirname(require.resolve('vite/package.json')),'dist/node/index.js');
const {build}=await import(pathToFileURL(vitePath).href);
const originalMain=execFileSync('git',['show','5ff521e3971739ecde05a22dd96c74827c0ae363:packages/ui/src/main.ts']).toString('utf8');
const result=await build({root:ui,configFile:path.join(ui,'vite.config.ts'),logLevel:'warn',plugins:[{
 name:'inspector-zero-byte-control',enforce:'pre',transform(code,id){
  if(id.split('?')[0].replaceAll('\\','/')===path.join(ui,'src/main.ts').replaceAll('\\','/'))return {code:originalMain,map:null};
 },
}],build:{write:false}});
const control=result.output.filter(row=>row.type==='chunk'&&row.fileName.endsWith('.js'));
const current=readdirSync(path.join(ui,'dist/assets')).filter(name=>name.endsWith('.js')).map(name=>readFileSync(path.join(ui,'dist/assets',name)));
const controlBytes=Buffer.concat(control.map(row=>Buffer.from(row.code))),currentBytes=Buffer.concat(current);
const data={head:execFileSync('git',['rev-parse','HEAD']).toString('utf8').trim(),variant:'Current error-log refs in both builds; current dev route vs original main.ts provided only in-memory',currentJsBytes:currentBytes.length,withoutInspectorJsBytes:controlBytes.length,rawByteDelta:currentBytes.length-controlBytes.length,inspectorAddedJsBytes:Math.max(0,currentBytes.length-controlBytes.length),byteIdentical:currentBytes.equals(controlBytes),currentGzipBytes:gzipSync(currentBytes).length,controlGzipBytes:gzipSync(controlBytes).length,currentSha256:createHash('sha256').update(currentBytes).digest('hex'),controlSha256:createHash('sha256').update(controlBytes).digest('hex')};
writeFileSync(new URL('./inspector-zero-byte.json',import.meta.url),JSON.stringify(data,null,2)+'\n','utf8');
writeFileSync(new URL('./without-inspector-control.js',import.meta.url),controlBytes);
console.log(JSON.stringify(data,null,2));
if(data.inspectorAddedJsBytes>0)throw Error('Inspector adds production JS; investigate before acceptance');
