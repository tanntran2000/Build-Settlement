import fs from 'node:fs';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
let html=fs.readFileSync(root+'bundle/comparison.html','utf8');
const images=[['equipment-player','Player equipment'],['equipment-npc','NPC equipment — option D'],['equipment','Equipment and item preview'],['market','Market'],['materials','Materials'],['temporary-storage','Temporary storage'],['potions','Potion shop'],['quartermaster-items','Quartermaster item Details'],['steward-items','Steward reward Details'],['death-letter','Wounds death letter']];
const gallery='<h2>1280px UI captures</h2><div class="captures">'+images.map(([file,label])=>'<figure><img alt="'+label+'" src="data:image/png;base64,'+fs.readFileSync(root+'screenshots/'+file+'-1280.png').toString('base64')+'"><figcaption>'+label+'</figcaption></figure>').join('')+'</div>';
html=html.replace('</style>','.captures{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px}figure{margin:0;padding:16px;background:var(--card,#f5f0e3);border:1px solid var(--border,#c9a36b);border-radius:var(--radius,8px)}figure img{display:block;width:100%;height:180px;object-fit:contain}figcaption{margin-top:10px;color:var(--muted-foreground,#6b4f2e)}h2{font-size:20px;margin-top:26px}</style>').replace('</html>',gallery+'</html>');
fs.writeFileSync(root+'review-preview.html',html,'utf8');
console.log('Wrote standalone bundle chart and ten PNG thumbnails to review-preview.html');
