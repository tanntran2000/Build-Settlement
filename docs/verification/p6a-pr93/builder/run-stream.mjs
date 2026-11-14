import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
const [name,command]=process.argv.slice(2);
const git=arg=>spawnSync('git',arg,{encoding:'utf8'}).stdout.trim();
const head=git(['rev-parse','HEAD']),tree=git(['rev-parse','HEAD^{tree}']),start=new Date().toISOString();
const file=new URL(`./${name}.txt`,import.meta.url);
const header=exit=>`HEAD: ${head}\nTree: ${tree}\nUTC start: ${start}\nCommand: ${command}\nExit: ${exit}\n\n`;
fs.writeFileSync(file,header('RUNNING'),'utf8');let output='';
const child=spawn(command,{shell:true,env:process.env,windowsHide:true});
for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{
 const text=chunk.toString();output+=text;fs.appendFileSync(file,text,'utf8');
 if(name==='a4-smoke')process.stdout.write(text);
});
child.on('error',error=>{output+=String(error);});
child.on('close',code=>{
 const result=header(code)+output+`\nUTC end: ${new Date().toISOString()}\n`;
 fs.writeFileSync(file,result,'utf8');console.log(name==='a4-smoke'?`Smoke exit: ${code}`:result.slice(-5000));process.exitCode=code??1;
});
