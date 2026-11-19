# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tile-save.spec.ts >> exports a real file, restores a multiweek plan and resumes the same economics
- Location: tests\e2e\tile-save.spec.ts:8:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 4
+ Received  + 0

@@ -62,14 +62,10 @@
      "producedMilli": 2000,
      "unmetMilli": 0,
    },
    "happinessAfter": 82,
    "happinessBefore": 80,
-   "householdUpkeep": Object {
-     "paidMilli": 3000,
-     "unpaidMilli": 0,
-   },
    "immigration": Object {
      "arrivals": 0,
      "populationAfter": 100,
      "populationBefore": 100,
      "reason": "no-capacity",
```

# Page snapshot

```yaml
- main [ref=e3]:
  - complementary "Life status and navigation" [ref=e4]:
    - navigation "Main" [ref=e5]:
      - generic [ref=e6]:
        - heading "Character Life" [level=1] [ref=e7]
        - paragraph [ref=e8]: Week 2 · Year 1 · Report
        - paragraph [ref=e9]: Health 100 / 100 · Regen +1/week
        - button "Report open — Plan next week in Report" [disabled] [ref=e10]
        - paragraph [ref=e11]: Week 1 · Year 1 report open. Choose Plan next week in Report before changing the plan.
        - status [ref=e12]: Week 1 · Year 1 report ready.
        - button "Information" [ref=e13] [cursor=pointer]
      - generic [ref=e14]:
        - button "Player" [ref=e15] [cursor=pointer]
        - button "Population" [ref=e16] [cursor=pointer]
      - generic [ref=e17]:
        - button "Session" [ref=e18] [cursor=pointer]
        - button "Help" [ref=e19] [cursor=pointer]
        - button "Options" [ref=e20] [cursor=pointer]
        - button "Main menu" [disabled] [ref=e21]
        - paragraph [ref=e22]: Plan next week first.
  - generic [ref=e23]:
    - generic [ref=e24]:
      - heading "Report" [level=2] [ref=e25]
      - navigation "Views" [ref=e26]:
        - button "City" [ref=e27] [cursor=pointer]
        - button "Characters" [ref=e28] [cursor=pointer]
        - button "Report" [ref=e29] [cursor=pointer]:
          - text: Report
          - generic [aria-hidden] [ref=e30]: New
    - region "Report" [ref=e31]:
      - region "Weekly city report" [ref=e32]:
        - generic [ref=e33]:
          - generic [ref=e34]:
            - heading "Week 1 · Year 1 report" [level=2] [ref=e35]
            - paragraph [aria-hidden] [ref=e36]: To the Lord of Haven
          - generic [ref=e37]:
            - generic [ref=e38]: Food 100%
            - generic [ref=e39]: Goods 100%
            - generic [ref=e40]: Happiness +2
        - generic [ref=e41]:
          - region "Your steward" [ref=e42]:
            - paragraph [ref=e43]: Your steward
            - generic [ref=e45]: Bad
            - heading "The treasury shrank" [level=3] [ref=e46]
            - generic [ref=e47]:
              - generic [ref=e48]:
                - term [ref=e49]: Gold
                - definition [ref=e50]: 188 → 184.45
              - generic [ref=e51]:
                - term [ref=e52]: Tax
                - definition [ref=e53]: "+3"
              - generic [ref=e54]:
                - term [ref=e55]: Upkeep paid
                - definition [ref=e56]: −4
              - generic [ref=e57]:
                - term [ref=e58]: Household upkeep
                - definition [ref=e59]: 3 Gold paid
            - group [ref=e60]:
              - generic "Details" [ref=e61] [cursor=pointer]
              - region "Steward item details" [ref=e62]:
                - heading "Rewards" [level=4] [ref=e63]
                - table [ref=e64]:
                  - caption [ref=e65]: Legendary rewards
                  - rowgroup [ref=e66]:
                    - row [ref=e67]:
                      - columnheader "Goal" [ref=e68]
                      - columnheader "Item" [ref=e69]
                  - rowgroup
                - paragraph [ref=e70]: No Legendary reward delivered this week.
                - table [ref=e71]:
                  - caption [ref=e72]: Rewards waiting
                  - rowgroup [ref=e73]:
                    - row [ref=e74]:
                      - columnheader "Goal" [ref=e75]
                      - columnheader "Status" [ref=e76]
                  - rowgroup
                - paragraph [ref=e77]: No rewards waiting.
              - generic [ref=e78]:
                - heading "Gold and upkeep" [level=3] [ref=e79]
                - paragraph [ref=e80]: "Tax: 3 Gold. Upkeep covered: 4 Gold; unfunded: 0 Gold (no debt). Farm batch payment: 2 Gold; extra Farm upkeep: 0 Gold."
              - group [ref=e81]:
                - generic "How this is calculated" [ref=e82] [cursor=pointer]
              - region "Laws" [ref=e83]:
                - heading "Laws" [level=3] [ref=e84]
                - paragraph [ref=e85]: No laws in force.
          - region "Quartermaster" [ref=e86]:
            - paragraph [ref=e87]: Quartermaster
            - generic [ref=e89]: Watch
            - heading "Some stores spoiled" [level=3] [ref=e90]
            - generic [ref=e91]:
              - generic [ref=e92]:
                - term [ref=e93]: Item found
                - definition [ref=e94]: Masterwork necklace · inventory
              - generic [ref=e95]:
                - term [ref=e96]: Food eaten
                - definition [ref=e97]: 4 of 4
              - generic [ref=e98]:
                - term [ref=e99]: Materials produced
                - definition [ref=e100]: Wood +4 · Iron +1
              - generic [ref=e101]:
                - term [ref=e102]: Spoiled
                - definition [ref=e103]: Wood −57 · Iron −10
            - group [ref=e104]:
              - generic "Details" [ref=e105] [cursor=pointer]
              - region "Quartermaster item details" [ref=e106]:
                - heading "Items this week" [level=4] [ref=e107]
                - table [ref=e108]:
                  - caption [ref=e109]: Materials this week
                  - rowgroup [ref=e110]:
                    - row [ref=e111]:
                      - columnheader "Plot" [ref=e112]
                      - columnheader "Material" [ref=e113]
                      - columnheader "Outcome" [ref=e114]
                  - rowgroup
                - paragraph [ref=e115]: No materials found.
                - table [ref=e116]:
                  - caption [ref=e117]: Item found
                  - rowgroup [ref=e118]:
                    - row [ref=e119]:
                      - columnheader "Item" [ref=e120]
                      - columnheader "Outcome" [ref=e121]
                  - rowgroup [ref=e122]:
                    - row [ref=e123]:
                      - cell "Masterwork necklace" [ref=e124]
                      - cell "Inventory" [ref=e125]
                - table [ref=e126]:
                  - caption [ref=e127]: Expired items
                  - rowgroup [ref=e128]:
                    - row [ref=e129]:
                      - columnheader "Item" [ref=e130]
                  - rowgroup
                - paragraph [ref=e131]: No items expired.
                - group "Recovery this week" [ref=e132]:
                  - generic [ref=e133]:
                    - term [ref=e134]: Hospital operated
                    - definition [ref=e135]: "No"
                  - generic [ref=e136]:
                    - term [ref=e137]: Regeneration
                    - definition [ref=e138]: "+1"
              - generic [ref=e139]:
                - heading "Needs and services" [level=3] [ref=e140]
                - paragraph [ref=e141]: "Food consumed: 4 / 4 · 100%."
                - paragraph [ref=e142]: "Food unmet: 0."
                - paragraph [ref=e143]: "Goods service: 1.45 / 1.45 · 100%. Materials used once: 2 Wood, 0 Iron. Revenue: 1.45 Gold."
                - paragraph [ref=e144]: "Goods stock: opening 10 · produced 2 · distributed 1.45 · closing 10.55. Demand 1.45; unmet 0; capacity 4; limited by none."
                - paragraph [ref=e145]: "Goods unmet: 0."
              - region "Weekly stock ledger scroll area" [ref=e146]:
                - table [ref=e147]:
                  - caption [ref=e148]: Weekly stock ledger
                  - rowgroup [ref=e149]:
                    - row [ref=e150]:
                      - columnheader "Stock" [ref=e151]
                      - columnheader "Before" [ref=e152]
                      - columnheader "Stock change" [ref=e153]
                      - columnheader "After" [ref=e154]
                  - rowgroup [ref=e155]:
                    - row [ref=e156]:
                      - rowheader "gold" [ref=e157]
                      - cell "188" [ref=e158]
                      - cell "-3.55" [ref=e159]
                      - cell "184.45" [ref=e160]
                    - row [ref=e161]:
                      - rowheader "wheat" [ref=e162]
                      - cell "0" [ref=e163]
                      - cell "2" [ref=e164]
                      - cell "2" [ref=e165]
                    - row [ref=e166]:
                      - rowheader "food" [ref=e167]
                      - cell "20" [ref=e168]
                      - cell "-2" [ref=e169]
                      - cell "18" [ref=e170]
                    - row [ref=e171]:
                      - rowheader "wood" [ref=e172]
                      - cell "95" [ref=e173]
                      - cell "-55" [ref=e174]
                      - cell "40" [ref=e175]
                    - row [ref=e176]:
                      - rowheader "iron" [ref=e177]
                      - cell "49" [ref=e178]
                      - cell "-9" [ref=e179]
                      - cell "40" [ref=e180]
              - group [ref=e181]:
                - generic "Building activity" [ref=e182] [cursor=pointer]
              - region "Outside report" [ref=e183]:
                - heading "Outside" [level=3] [ref=e184]
                - paragraph [ref=e185]: "57 Wood spoiled: storage full."
                - paragraph [ref=e186]: "10 Iron spoiled: storage full."
                - generic [ref=e187]:
                  - generic [ref=e188]:
                    - term [ref=e189]: wood produced
                    - definition [ref=e190]: "4"
                  - generic [ref=e191]:
                    - term [ref=e192]: iron produced
                    - definition [ref=e193]: "1"
                  - generic [ref=e194]:
                    - term [ref=e195]: stone produced
                    - definition [ref=e196]: "0"
                  - generic [ref=e197]:
                    - term [ref=e198]: wool produced
                    - definition [ref=e199]: "0"
                  - generic [ref=e200]:
                    - term [ref=e201]: herbs produced
                    - definition [ref=e202]: "0"
                  - generic [ref=e203]:
                    - term [ref=e204]: cloth produced
                    - definition [ref=e205]: "0"
                  - generic [ref=e206]:
                    - term [ref=e207]: stone stock before / after
                    - definition [ref=e208]: 0 / 0
                  - generic [ref=e209]:
                    - term [ref=e210]: wool stock before / after
                    - definition [ref=e211]: 0 / 0
                  - generic [ref=e212]:
                    - term [ref=e213]: cloth stock before / after
                    - definition [ref=e214]: 0 / 0
                  - generic [ref=e215]:
                    - term [ref=e216]: herbs stock before / after
                    - definition [ref=e217]: 0 / 0
          - region "Census clerk" [ref=e218]:
            - paragraph [ref=e219]: Census clerk
            - generic [ref=e221]: News
            - heading "The census is unchanged" [level=3] [ref=e222]
            - generic [ref=e223]:
              - generic [ref=e224]:
                - term [ref=e225]: Free residents
                - definition [ref=e226]: 80 → 82
              - generic [ref=e227]:
                - term [ref=e228]: Makers
                - definition [ref=e229]: 80 → 82
              - generic [ref=e230]:
                - term [ref=e231]: Luminaries
                - definition [ref=e232]: 80 → 82
              - generic [ref=e233]:
                - term [ref=e234]: Merchants
                - definition [ref=e235]: 80 → 82
            - group [ref=e236]:
              - generic "Details" [ref=e237] [cursor=pointer]
              - generic [ref=e238]:
                - heading "Population and happiness" [level=3] [ref=e239]
                - paragraph [ref=e240]: "Population: 100 → 100 · 0 arrivals · Available next week."
                - paragraph [ref=e241]: "Happiness: 80 → 82."
              - region "Society this week" [ref=e242]:
                - region "Classes this week scroll area" [ref=e243]:
                  - table [ref=e244]:
                    - caption [ref=e245]: Classes this week
                    - rowgroup [ref=e246]:
                      - row [ref=e247]:
                        - columnheader "Class" [ref=e248]
                        - columnheader "Food" [ref=e249]
                        - columnheader "Goods" [ref=e250]
                        - columnheader "Luxury" [ref=e251]
                        - columnheader "Satisfaction" [ref=e252]
                        - columnheader "Arrivals" [ref=e253]
                        - columnheader "Trained" [ref=e254]
                        - columnheader "Enslaved" [ref=e255]
                    - rowgroup [ref=e256]:
                      - row [ref=e257]:
                        - rowheader "Free residents" [ref=e258]
                        - cell "100%" [ref=e259]
                        - cell "100%" [ref=e260]
                        - cell "—" [ref=e261]
                        - cell "80 → 82" [ref=e262]
                        - cell "0" [ref=e263]
                        - cell "0" [ref=e264]
                        - cell "0" [ref=e265]
                      - row [ref=e266]:
                        - rowheader "Makers" [ref=e267]
                        - cell "100%" [ref=e268]
                        - cell "100%" [ref=e269]
                        - cell "—" [ref=e270]
                        - cell "80 → 82" [ref=e271]
                        - cell "0" [ref=e272]
                        - cell "0" [ref=e273]
                        - cell "0" [ref=e274]
                      - row [ref=e275]:
                        - rowheader "Luminaries" [ref=e276]
                        - cell "100%" [ref=e277]
                        - cell "100%" [ref=e278]
                        - cell "—" [ref=e279]
                        - cell "80 → 82" [ref=e280]
                        - cell "0" [ref=e281]
                        - cell "0" [ref=e282]
                        - cell "0" [ref=e283]
                      - row [ref=e284]:
                        - rowheader "Merchants" [ref=e285]
                        - cell "100%" [ref=e286]
                        - cell "100%" [ref=e287]
                        - cell "—" [ref=e288]
                        - cell "80 → 82" [ref=e289]
                        - cell "0" [ref=e290]
                        - cell "0" [ref=e291]
                        - cell "0" [ref=e292]
                      - row [ref=e293]:
                        - rowheader "The Bound" [ref=e294]
                        - cell "100%" [ref=e295]
                        - cell "100%" [ref=e296]
                        - cell "—" [ref=e297]
                        - cell "80 → 80" [ref=e298]
                        - cell "0" [ref=e299]
                        - cell "0" [ref=e300]
                        - cell "0" [ref=e301]
                - list [ref=e302]:
                  - listitem [ref=e303]: Some Luminaries had no work, so debt pressure rose.
                  - listitem [ref=e304]: Some Merchants had no work, so debt pressure rose.
                - paragraph [ref=e305]: "Bound Desperation: 0 → 0"
                - paragraph [ref=e306]: "Luxury imported: 0. Training cost: 0 Gold."
          - region "Captain of the watch" [ref=e307]:
            - paragraph [ref=e308]: Captain of the watch
            - generic [ref=e310]: News
            - heading "The streets are quiet" [level=3] [ref=e311]
            - generic [ref=e312]:
              - generic [ref=e313]:
                - term [ref=e314]: Security
                - definition [ref=e315]: 30 → 25
              - generic [ref=e316]:
                - term [ref=e317]: Crime
                - definition [ref=e318]: 10 → 5
              - generic [ref=e319]:
                - term [ref=e320]: Authority
                - definition [ref=e321]: 50 → 47
              - term [ref=e323]: "Garrison: 0 soldiers, Security +0."
            - group [ref=e324]:
              - generic "Details" [active] [ref=e325] [cursor=pointer]
          - region "Word from the streets" [ref=e326]:
            - paragraph [ref=e327]: Word from the streets
            - generic [ref=e329]: News
            - heading "The streets are calm" [level=3] [ref=e330]
            - generic [ref=e331]:
              - generic [ref=e332]:
                - term [ref=e333]: Tension
                - definition [ref=e334]: 0 → 0
              - generic [ref=e335]:
                - term [ref=e336]: Desperation
                - definition [ref=e337]: 0 → 0
            - group [ref=e338]:
              - generic "Details" [ref=e339] [cursor=pointer]
        - paragraph [aria-hidden] [ref=e340]: Your steward
        - button "Plan next week" [ref=e341] [cursor=pointer]
```

# Test source

```ts
  419 |   } else await expect(panel.getByTestId('trial-immigration')).toHaveCount(0);
  420 |   if (!activityOpen) await activity.locator('summary').click();
  421 |   if (!calculationOpen) await calculation.locator('summary').click();
  422 |   if(expected.outside){
  423 |     const region=panel.getByRole('region',{name:'Outside report',exact:true});
  424 |     const outside:NonNullable<TileTrialReport['outside']>={producedMilli:{wood:0,iron:0,stone:0,wool:0,herbs:0,cloth:0},stocksBefore:{stone:0,wool:0,cloth:0,herbs:0},stocksAfter:{stone:0,wool:0,cloth:0,herbs:0},hospitalsIdle:[],cleared:[],researchCompleted:[],exhausted:[],spoiledMilli:{}};
  425 |     for(const good of Object.keys(outside.producedMilli) as (keyof typeof outside.producedMilli)[])outside.producedMilli[good]=reportMilli((await region.locator(`[data-outside-produced="${good}"]`).textContent())!);
  426 |     for(const good of Object.keys(outside.stocksBefore) as (keyof typeof outside.stocksBefore)[]){const [before,after]=(await region.locator(`[data-outside-stock="${good}"]`).textContent())!.split(' / ');outside.stocksBefore[good]=reportMilli(before);outside.stocksAfter[good]=reportMilli(after);}
  427 |     for(const line of await region.locator('p').allTextContents()){
  428 |       let match=line.match(/^([\d,.]+) (\w+) spoiled: storage full\.$/);
  429 |       if(match){outside.spoiledMilli[match[2].toLowerCase() as keyof typeof outside.spoiledMilli]=reportMilli(match[1]);continue;}
  430 |       match=line.match(/^(.+): deposit exhausted; the (.+) closed and the plot is now plain\.$/);
  431 |       if(match){expect(match[2]).toBe(match[1].startsWith('ore-')?'Iron Mine':'Quarry');outside.exhausted.push(match[1]);continue;}
  432 |       match=line.match(/^(.+) cleared\.$/);if(match){outside.cleared.push(match[1]);continue;}
  433 |       const researchLabels={'deep-mining':'Deep Mining','watch-patrols':'Watch Patrols','barracks-drill':'Barracks Drill'} as const;
  434 |       const topic=(Object.keys(researchLabels) as (keyof typeof researchLabels)[]).find(key=>line===`Research completed: ${researchLabels[key]}.`);
  435 |       if(topic){outside.researchCompleted.push(topic);continue;}
  436 |       match=line.match(/^(.+): Hospital idle, no Herbs\.$/);if(match){outside.hospitalsIdle.push(match[1]);continue;}
  437 |       throw Error(`Unknown Outside report line: ${line}`);
  438 |     }
  439 |     actual.outside=outside;
  440 |   }
  441 |   if(expected.order){
  442 |     const captainDetails=panel.locator('[data-letter="captain"] > details');
  443 |     const captainWasOpen=await captainDetails.getAttribute('open')!==null;
  444 |     await openReportDetails(page,'captain');
  445 |     try {
  446 |     const region=panel.getByRole('region',{name:'Order',exact:true});
  447 |     await expect(region).toBeVisible();
  448 |     const order:NonNullable<TileTrialReport['order']>={soldiers:Number(await region.getAttribute('data-order-soldiers')),garrisonSecurity:Number(await region.getAttribute('data-order-garrison-security')),before:{security:0,crime:0,authority:0},after:{security:0,crime:0,authority:0},targets:{security:0,crime:0,authority:0},theftMilli:{},tensionAdded:0,satisfactionLost:0,taxModifierBps:0,taxDeltaMilli:0,arrivalsBudgetBefore:0,arrivalsBudgetAfter:0};
  449 |     for(const key of ['security','crime','authority'] as const){
  450 |       const value=region.locator(`[data-order-value="${key}"]`);
  451 |       await expect(value).toBeVisible();
  452 |       const text=(await value.textContent())!;
  453 |       const values=text.match(/\d+/g)!.map(Number);
  454 |       [order.before[key],order.after[key],order.targets[key]]=values;
  455 |     }
  456 |     const calculation=region.locator('details:has(> summary:text-is("Order calculation"))');
  457 |     const calculationWasOpen=await calculation.getAttribute('open')!==null;
  458 |     if(!calculationWasOpen)await calculation.locator(':scope > summary').click();
  459 |     try {
  460 |     for(const value of await region.locator('[data-order-theft], [data-order-detail]').all())await expect(value).toBeVisible();
  461 |     for(const entry of await region.locator('[data-order-theft]').evaluateAll(nodes=>nodes.map(n=>({key:n.getAttribute('data-order-theft')!,text:n.textContent!}))))order.theftMilli[entry.key as keyof typeof order.theftMilli]=reportMilli(entry.text);
  462 |     for(const key of ['taxModifierBps','taxDeltaMilli','arrivalsBudgetBefore','arrivalsBudgetAfter','tensionAdded','satisfactionLost'] as const)order[key]=Number(await region.locator(`[data-order-detail="${key}"]`).textContent());
  463 |     actual.order=order;
  464 |     } finally {
  465 |       if(!calculationWasOpen)await calculation.locator(':scope > summary').click();
  466 |     }
  467 |     } finally {
  468 |       if(!captainWasOpen)await captainDetails.locator(':scope > summary').click();
  469 |     }
  470 |   }
  471 |   if(expected.crisis){
  472 |     const region=panel.getByRole('region',{name:'Crisis',exact:true,includeHidden:true});
  473 |     const fields=await region.evaluate(node=>Object.fromEntries([...node.attributes].filter(a=>a.name.startsWith('data-crisis-')).map(a=>[a.name.slice(12),a.value])));
  474 |     const c:NonNullable<TileTrialReport['crisis']>={stageBefore:fields['stage-before'] as NonNullable<TileTrialReport['crisis']>['stageBefore'],stageAfter:fields['stage-after'] as NonNullable<TileTrialReport['crisis']>['stageAfter'],hungry:fields.hungry==='true',hungerStreak:Number(fields['hunger-streak']),calmStreak:Number(fields['calm-streak']),weeksInStage:Number(fields['weeks-in-stage']),cardOpened:(fields['card-opened']||null) as NonNullable<TileTrialReport['crisis']>['cardOpened'],tensionBefore:Number(fields['tension-before']),tensionAfter:Number(fields['tension-after']),promise:null,lastChoice:null};
  475 |     const promise=region.locator('[data-crisis-promise]');
  476 |     if(await promise.count()){const p=await promise.evaluate(n=>({stage:n.getAttribute('data-crisis-stage'),result:n.getAttribute('data-crisis-result'),tensionDelta:Number(n.getAttribute('data-crisis-tension')),authorityDelta:Number(n.getAttribute('data-crisis-authority'))}));c.promise=p as NonNullable<typeof c.promise>;}
  477 |     const choice=region.locator('[data-crisis-choice]');
  478 |     if(await choice.count()){const a=await choice.evaluate(n=>({stage:n.getAttribute('data-crisis-stage'),option:n.getAttribute('data-crisis-option'),goldMilli:Number(n.getAttribute('data-crisis-gold'))}));c.lastChoice=a as NonNullable<typeof c.lastChoice>;}
  479 |     actual.crisis=c;
  480 |   }
  481 |   const crime=panel.getByRole('region',{name:'Crime',exact:true,includeHidden:true});
  482 |   if(await crime.count()){
  483 |     const f=await crime.evaluate(node=>Object.fromEntries([...node.attributes].filter(a=>a.name.startsWith('data-crime-')).map(a=>[a.name.slice(11),a.value])));
  484 |     const c:NonNullable<TileTrialReport['crimeEvent']>={standingBefore:Number(f['standing-before']),standingAfter:Number(f['standing-after']),chancePercent:Number(f['chance-percent']),lordHealthLoss:Number(f['lord-health-loss']),event:null};
  485 |     if(f.kind){
  486 |       const e:NonNullable<typeof c.event>={kind:f.kind as NonNullable<typeof c.event>['kind'],severity:f.severity as NonNullable<typeof c.event>['severity']};
  487 |       if(f.target)e.target=f.target as typeof e.target;
  488 |       if(f.outcome)e.outcome=f.outcome as typeof e.outcome;
  489 |       for(const [attr,key] of [['loss-milli','lossMilli'],['soldiers-killed','soldiersKilled'],['standing-loss','standingLoss'],['authority-loss','authorityLoss']] as const)if(f[attr]!=='')e[key]=Number(f[attr]);
  490 |       c.event=e;
  491 |     }
  492 |     actual.crimeEvent=c;
  493 |   }
  494 |   const laws=panel.getByRole('region',{name:'Laws',exact:true,includeHidden:true});
  495 |   if(await laws.count()) actual.laws=await laws.evaluate(node=>({inForce:JSON.parse(node.getAttribute('data-laws-in-force')!),costs:JSON.parse(node.getAttribute('data-laws-costs')!),unfunded:JSON.parse(node.getAttribute('data-laws-unfunded')!),incomeMilli:Number(node.getAttribute('data-laws-income-milli')),promise:JSON.parse(node.getAttribute('data-laws-promise')!)}));
  496 |   const notes = panel.getByRole('region', { name: 'NPC life', exact: true, includeHidden: true });
  497 |   if (await notes.count()) {
  498 |     await expect(notes).toBeVisible();
  499 |     const npcLife: NonNullable<TileTrialReport['npcLife']> = { exhausted: [], recovered: [], birthdays: [] };
  500 |     const labels = { exhausted: 'Exhausted', recovered: 'Recovered', birthdays: 'Birthday' };
  501 |     const rows = notes.getByRole('listitem', { includeHidden: true });
  502 |     await expect(rows).not.toHaveCount(0);
  503 |     for (const row of await rows.all()) {
  504 |       const kind = await row.getAttribute('data-npc-life-kind');
  505 |       const id = await row.getAttribute('data-npc-id');
  506 |       if ((kind !== 'exhausted' && kind !== 'recovered' && kind !== 'birthdays') || !id) {
  507 |         throw Error('Invalid NPC life report row.');
  508 |       }
  509 |       const name = row.locator('strong');
  510 |       await expect(row).toBeVisible();
  511 |       await expect(name).toBeVisible();
  512 |       await expect(name).toHaveText(/\S/);
  513 |       await expect(row).toHaveText(`${labels[kind]} · ${(await name.innerText()).trim()}`);
  514 |       npcLife[kind].push(id);
  515 |     }
  516 |     actual.npcLife = npcLife;
  517 |   }
  518 |   const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;
> 519 |   expect(actual).toEqual(baseReport);
      |                  ^ Error: expect(received).toEqual(expected) // deep equality
  520 |   if (society) {
  521 |     const labels = { free: 'Free residents', makers: 'Makers', luminaries: 'Luminaries', merchants: 'Merchants', bound: 'The Bound' };
  522 |     const classes = panel.getByRole('table', { name: 'Classes this week', exact: true });
  523 |     await expect(classes.getByRole('columnheader')).toHaveText(['Class', 'Food', 'Goods', 'Luxury', 'Satisfaction', 'Arrivals', 'Trained', 'Enslaved']);
  524 |     for (const id of Object.keys(labels) as (keyof typeof labels)[]) {
  525 |       const row = society.classes[id];
  526 |       await expect(classes.getByTestId(`society-report-${id}`).locator('th,td')).toHaveText([
  527 |         labels[id], `${row.foodBps / 100}%`, `${row.goodsBps / 100}%`, row.luxuryBps === null ? '—' : `${row.luxuryBps / 100}%`,
  528 |         `${row.satisfactionBefore} → ${row.satisfactionAfter}`, String(row.arrivals), String(row.trained), String(row.enslaved),
  529 |       ]);
  530 |     }
  531 |     await expect(panel.getByText(`Bound Desperation: ${society.desperationBefore} → ${society.desperationAfter}`, { exact: true })).toBeVisible();
  532 |     await expect(panel.getByText(`Luxury imported: ${(luxuryImportedMilli ?? 0) / 1000}. Training cost: ${(trainingGoldMilli ?? 0) / 1000} Gold.`, { exact: true })).toBeVisible();
  533 |   }
  534 |   for (const details of closedLetters.reverse()) await details.locator(':scope > summary').click();
  535 |   return actual;
  536 | }
  537 | 
  538 | // Include hidden destinations, live controls and the entire diagnostic region.
  539 | export async function lifeUiSnapshot(page: Page) {
  540 |   await expect(page.locator('[aria-label="Error log"] [role="status"]').filter({ hasText: /^Saving recent errors/ })).toHaveCount(0);
  541 |   return page.getByTestId('life-shell').evaluate(shell => {
  542 |     const copy = shell.cloneNode(true) as HTMLElement;
  543 |     copy.querySelectorAll('[data-life-error], [aria-label="Planning checkpoints"] [role="status"]').forEach(node => node.remove());
  544 |     return {
  545 |       markup: copy.outerHTML,
  546 |       controls: [...shell.querySelectorAll('input:not([type="file"]),select')].map(node => ({ id: node.id, value: (node as HTMLInputElement).value, disabled: (node as HTMLInputElement).disabled })),
  547 |     };
  548 |   });
  549 | }
  550 | 
  551 | // A current rejection may log exactly one RUNTIME/INVALID_COMMAND; superseded reads get no exception.
  552 | export async function expectCheckpointRejectionPreservesUi(page: Page, before: Awaited<ReturnType<typeof lifeUiSnapshot>>, expectedAbsoluteWeek: number) {
  553 |   const after = await lifeUiSnapshot(page);
  554 |   const { version } = JSON.parse(await readFile(new URL('../../packages/ui/package.json', import.meta.url), 'utf8'));
  555 |   const normalized = await page.evaluate(({ before, after, version, expectedAbsoluteWeek }) => {
  556 |     const prior = document.createElement('div'), current = document.createElement('div');
  557 |     prior.innerHTML = before; current.innerHTML = after;
  558 |     const oldLog = prior.querySelector('[aria-label="Error log"]')!, newLog = current.querySelector('[aria-label="Error log"]')!;
  559 |     const check = (condition: boolean, message: string) => { if (!condition) throw new Error(`Unexpected diagnostic delta: ${message}`); };
  560 |     const canonical = (element: Element) => {
  561 |       const copy = element.cloneNode(true);
  562 |       const trim = (node: Node) => { for (const child of [...node.childNodes]) {
  563 |         if (child.nodeType === Node.COMMENT_NODE || child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) child.remove(); else trim(child);
  564 |       } };
  565 |       trim(copy); return (copy as Element).outerHTML;
  566 |     };
  567 |     const oldEntries = [...oldLog.querySelectorAll('ol > li')], newEntries = [...newLog.querySelectorAll('ol > li')];
  568 |     const last = newEntries.at(-1)!;
  569 |     check(!!last, 'missing checkpoint entry');
  570 |     const paragraphs = [...last.children];
  571 |     check(paragraphs.length === 5 && paragraphs.every(node => node.tagName === 'P'), 'entry structure');
  572 |     const heading = 'validation · INVALID_COMMAND', message = 'The action input was rejected. Check the form and try again.', context = `weekly · RUNTIME · Week ${expectedAbsoluteWeek}`;
  573 |     check(paragraphs[0].textContent === heading && paragraphs[1].textContent === message && paragraphs[2].textContent === context, 'checkpoint code/message/context');
  574 |     const times = [...last.querySelectorAll('time')];
  575 |     check(times.length === 2 && times.every(node => node.textContent === node.getAttribute('datetime')), 'UTC representation');
  576 |     const first = times[0].textContent!, latest = times[1].textContent!;
  577 |     check(Number.isFinite(Date.parse(latest)) && new Date(latest).toISOString() === latest && Date.now() - Date.parse(latest) >= 0 && Date.now() - Date.parse(latest) < 10000, 'checkpoint UTC');
  578 |     const oldLast = oldEntries.at(-1), oldParagraphs = oldLast ? [...oldLast.children] : [];
  579 |     const coalesced = !!oldLast && oldParagraphs[0].textContent === heading && oldParagraphs[2].textContent === context && oldParagraphs[4].textContent!.endsWith(` · App version: ${version} · Build unavailable`);
  580 |     const oldCount = coalesced ? Number(oldParagraphs[4].textContent!.match(/^Occurrences: (\d+)/)![1]) : 0;
  581 |     const count = Math.min(Number.MAX_SAFE_INTEGER, oldCount + 1);
  582 |     check(paragraphs[4].textContent === `Occurrences: ${count} · App version: ${version} · Build unavailable`, 'occurrence/version');
  583 |     const history = coalesced ? oldEntries.slice(0, -1) : oldEntries.slice(-4);
  584 |     check(newEntries.length === history.length + 1, 'extra/missing diagnostic group');
  585 |     history.forEach((entry, index) => check(canonical(entry) === canonical(newEntries[index]), 'pre-existing history'));
  586 |     if (coalesced) {
  587 |       const expected = oldLast!.cloneNode(true) as Element;
  588 |       const lastTime = expected.querySelectorAll('time')[1];
  589 |       lastTime.textContent = latest; lastTime.setAttribute('datetime', latest);
  590 |       expected.children[4].textContent = `Occurrences: ${count} · App version: ${version} · Build unavailable`;
  591 |       check(canonical(expected) === canonical(last), 'coalesced entry changed beyond last UTC/count');
  592 |     } else {
  593 |       check(first === latest, 'new entry UTC');
  594 |       check(paragraphs[0].children.length === 1 && paragraphs[0].firstElementChild?.tagName === 'STRONG' && paragraphs[1].children.length === 0 && paragraphs[2].children.length === 0 && paragraphs[4].children.length === 0, 'new entry content');
  595 |       check([...paragraphs[3].children].map(node => node.tagName).join(',') === 'TIME,BR,TIME' && paragraphs[3].textContent === `First UTC: ${first}Last UTC: ${latest}`, 'new entry dates');
  596 |     }
  597 |     const oldFrame = oldLog.cloneNode(true) as Element, newFrame = newLog.cloneNode(true) as Element;
  598 |     const paragraph = (frame: Element, text: string) => [...frame.children].find(node => node.tagName === 'P' && node.textContent === text);
  599 |     const records = newFrame.querySelector('ol')!;
  600 |     check(records.getAttribute('aria-label') === 'Recorded errors', 'records label');
  601 |     const oldRecords = oldFrame.querySelector('ol');
  602 |     if (oldRecords) oldRecords.replaceChildren();
  603 |     else {
  604 |       const empty = paragraph(oldFrame, 'No errors recorded.'); check(!!empty, 'empty records');
  605 |       empty!.replaceWith(records.cloneNode(false));
  606 |     }
  607 |     records.replaceChildren();
  608 |     if (!oldEntries.length) (oldFrame.querySelector('button') as HTMLButtonElement).disabled = false;
  609 |     if (!paragraph(oldFrame, 'Saved locally in this browser.') && !paragraph(oldFrame, 'Not saved — this tab only. Download before closing.')) {
  610 |       const saved = paragraph(newFrame, 'Saved locally in this browser.'); check(!!saved, 'persistence transition'); saved!.remove();
  611 |     }
  612 |     for (const text of ['Download requested.', 'Unable to request download. Your error log is unchanged.']) {
  613 |       check(!paragraph(newFrame, text), 'new checkpoint must clear previous download feedback');
  614 |       paragraph(oldFrame, text)?.remove();
  615 |     }
  616 |     check(canonical(oldFrame) === canonical(newFrame), 'diagnostic status/control/frame');
  617 |     // Replace only after independently verifying every permitted log change and all unrelated history/UI.
  618 |     newLog.replaceWith(oldLog.cloneNode(true));
  619 |     return current.firstElementChild!.outerHTML;
```