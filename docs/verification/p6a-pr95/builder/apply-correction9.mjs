import fs from 'node:fs';
const root='C:/Users/Admin/.t3/local-drafts/p6a-prC/';
function replace(file,before,after){
 const text=fs.readFileSync(file,'utf8');
 if(text.includes('\r\n')){before=before.replaceAll('\n','\r\n');after=after.replaceAll('\n','\r\n');}
 if(text.split(before).length!==2)throw Error('HOLD: nonunique anchor '+file);
 fs.writeFileSync(file,text.replace(before,after),'utf8');
}
const p11=JSON.parse(fs.readFileSync(root+'P11-proposal.json','utf8'));
replace(p11.file,p11.before,p11.after);
const equipment='packages/ui/src/EquipmentView.svelte';
replace(equipment,'   <svg role="img" aria-label="Character silhouette" viewBox="0 0 100 200"><circle cx="50" cy="24" r="17"/><path d="M34 47H66L83 100L72 105L61 72L63 125L69 188H54L50 139L46 188H31L37 125L39 72L28 105L17 100Z"/></svg>',`   {#if kind==='npc'}
   <svg role="img" aria-label="NPC silhouette" viewBox="0 0 100 200"><g stroke="#d9c499" stroke-width="2" stroke-linejoin="round">
    <path d="M28 128C26 150 33 168 35 193L46 193L48 140Z"/>
    <path d="M72 128C74 150 67 168 65 193L54 193L52 140Z"/>
    <path d="M29 152L47 155M71 152L53 155" fill="none"/>
    <path d="M40 98L60 98C67 106 67 116 60 124L40 124C33 116 33 106 40 98Z"/>
    <circle cx="35" cy="124" r="17"/><circle cx="65" cy="124" r="17"/>
    <path d="M36 44C44 40 56 40 64 44C70 48 70 56 66 64L60 100L40 100L34 64C30 56 30 48 36 44Z"/>
    <circle cx="38.5" cy="71" r="14.5"/><circle cx="61.5" cy="71" r="14.5"/>
    <path d="M64 44C72 46 78 52 82 62L89 80L70 103L64 97L80 80L74 65Z"/>
    <path d="M36 44C28 46 22 52 18 62L11 80L30 103L36 97L20 80L26 65Z"/>
    <path d="M58 14C66 6 75 10 73 20C71 29 64 34 60 30C64 26 66 20 62 16Z" stroke="none"/>
    <rect x="46" y="33" width="8" height="10" stroke="none"/>
    <circle cx="50" cy="24" r="12"/></g></svg>
   {:else}
   <svg role="img" aria-label="Character silhouette" viewBox="0 0 100 200"><circle cx="50" cy="24" r="17"/><path d="M34 47H66L83 100L72 105L61 72L63 125L69 188H54L50 139L46 188H31L37 125L39 72L28 105L17 100Z"/></svg>
   {/if}`);
replace(equipment,'.doll{position:relative;', '.doll{--focus:var(--ink);position:relative;');
replace(equipment,"button[aria-pressed='true']{outline:","button[aria-pressed='true']{font-weight:700;outline:");
replace('packages/ui/src/SoloWeekReport.svelte','  th:first-child { text-align: left; }',`  section[aria-label='Steward item details'] table,
  section[aria-label='Quartermaster item details'] table { table-layout: fixed; }
  section[aria-label='Steward item details'] :is(th, td),
  section[aria-label='Quartermaster item details'] :is(th, td) { min-width: 0; max-width: none; overflow-wrap: anywhere; }
  th:first-child { text-align: left; }`);
replace('packages/ui/src/ItemCard.svelte',"{warden:'Watch House Security +3',crown:'Authority +3',ironhide:'Wound damage −5',ledger:'One more research point'}",'{warden:`Watch House Security +${ITEM_TRIAL.effects.wardenSecurity}`,crown:`Authority +${ITEM_TRIAL.effects.crownAuthority}`,ironhide:`Wound damage −${ITEM_TRIAL.effects.ironhideWoundReduction}`,ledger:`Post output +${ITEM_TRIAL.effects.ledgerOutputPercent}%`}');
fs.appendFileSync(root+'progress.md','\nCorrection 9: owner released C3 HOLD. Both new RED cases failed at the intended Ledger sentence and NPC label before product edits (fix-RED-e2e.txt). Applied the exact P11 block, the selected weight/focus token, item-Details-only wrapping, catalog-derived trait sentences, and the supplied NPC SVG. No existing silhouette markup pin was found; Player artwork is unchanged.\n','utf8');
console.log('Applied correction 9 to the five approved existing/new product/test paths; new RED cases are in items.spec.ts.');
