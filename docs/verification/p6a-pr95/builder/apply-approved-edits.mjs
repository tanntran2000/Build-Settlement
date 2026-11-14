import fs from 'node:fs';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
const inventory=JSON.parse(fs.readFileSync(root+'step0-proposed-edits.json','utf8'));
const task=process.argv[2]; if(!['C1','C2'].includes(task))throw Error('Task must be C1 or C2');
for(const {file} of inventory.files){
  const edits=inventory.edits.filter(e=>e.file===file&&e.task===task);if(!edits.length)continue;
  const raw=fs.readFileSync(file,'utf8'), crlf=raw.includes('\r\n');let text=raw.replace(/\r\n/g,'\n');
  for(const edit of edits){const at=text.indexOf(edit.before);if(at<0||text.indexOf(edit.before,at+edit.before.length)>=0)throw Error('HOLD: changed approved anchor '+edit.id);text=text.replace(edit.before,edit.after);}
  fs.writeFileSync(file,crlf?text.replace(/\n/g,'\r\n'):text,'utf8');
  console.log(`${task}: ${file}: ${edits.map(e=>e.id).join(', ')}`);
}
