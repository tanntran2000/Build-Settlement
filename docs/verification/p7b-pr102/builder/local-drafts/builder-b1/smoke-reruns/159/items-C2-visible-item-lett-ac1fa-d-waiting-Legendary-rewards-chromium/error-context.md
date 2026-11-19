# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: items.spec.ts >> C2 visible item letters include stack loss, storage-full loss, expiry, delivered and waiting Legendary rewards
- Location: tests\e2e\items.spec.ts:124:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 4
+ Received  + 0

@@ -60,14 +60,10 @@
      "producedMilli": 0,
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
                - term [ref=e49]: Reward waiting
                - definition [ref=e50]: Authority 90+ for 4 weeks · Make room in inventory or temporary storage.
              - generic [ref=e51]:
                - term [ref=e52]: Gold
                - definition [ref=e53]: 997 → 995.55
              - generic [ref=e54]:
                - term [ref=e55]: Upkeep paid
                - definition [ref=e56]: −2.5
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
                  - rowgroup [ref=e70]:
                    - row [ref=e71]:
                      - cell "Calm city" [ref=e72]
                      - cell "Crown of Embers" [ref=e73]
                - table [ref=e74]:
                  - caption [ref=e75]: Rewards waiting
                  - rowgroup [ref=e76]:
                    - row [ref=e77]:
                      - columnheader "Goal" [ref=e78]
                      - columnheader "Status" [ref=e79]
                  - rowgroup [ref=e80]:
                    - row [ref=e81]:
                      - cell "Authority 90+ for 4 weeks" [ref=e82]
                      - cell "Make room in inventory or temporary storage." [ref=e83]
              - generic [ref=e84]:
                - heading "Gold and upkeep" [level=3] [ref=e85]
                - paragraph [ref=e86]: "Tax: 3.6 Gold. Upkeep covered: 2.5 Gold; unfunded: 0 Gold (no debt). Farm batch payment: 2 Gold; extra Farm upkeep: 0 Gold."
              - group [ref=e87]:
                - generic "How this is calculated" [ref=e88] [cursor=pointer]
              - region "Laws" [ref=e89]:
                - heading "Laws" [level=3] [ref=e90]
                - paragraph [ref=e91]: No laws in force.
          - region "Quartermaster" [ref=e92]:
            - paragraph [ref=e93]: Quartermaster
            - generic [ref=e95]: Watch
            - heading "Some stores spoiled" [level=3] [ref=e96]
            - generic [ref=e97]:
              - generic [ref=e98]:
                - term [ref=e99]: Material lost
                - definition [ref=e100]: Iron · ore-1 · stack full (999)
              - generic [ref=e101]:
                - term [ref=e102]: Item lost
                - definition [ref=e103]: Retainer's Plain Hand · inventory and temporary storage full
              - generic [ref=e104]:
                - term [ref=e105]: Expired item
                - definition [ref=e106]: Fine Ring
              - generic [ref=e107]:
                - term [ref=e108]: Spoiled
                - definition [ref=e109]: Food −960 · Wood −959 · Iron −960
            - group [ref=e110]:
              - generic "Details" [ref=e111] [cursor=pointer]
              - region "Quartermaster item details" [ref=e112]:
                - heading "Items this week" [level=4] [ref=e113]
                - table [ref=e114]:
                  - caption [ref=e115]: Materials this week
                  - rowgroup [ref=e116]:
                    - row [ref=e117]:
                      - columnheader "Plot" [ref=e118]
                      - columnheader "Material" [ref=e119]
                      - columnheader "Outcome" [ref=e120]
                  - rowgroup [ref=e121]:
                    - row [ref=e122]:
                      - cell "ore-1" [ref=e123]
                      - cell "Iron" [ref=e124]
                      - 'cell "Lost: stack full (999)" [ref=e125]'
                - table [ref=e126]:
                  - caption [ref=e127]: Item found
                  - rowgroup [ref=e128]:
                    - row [ref=e129]:
                      - columnheader "Item" [ref=e130]
                      - columnheader "Outcome" [ref=e131]
                  - rowgroup [ref=e132]:
                    - row [ref=e133]:
                      - cell "Retainer's Plain Hand" [ref=e134]
                      - 'cell "Lost: inventory and temporary storage full" [ref=e135]'
                - table [ref=e136]:
                  - caption [ref=e137]: Expired items
                  - rowgroup [ref=e138]:
                    - row [ref=e139]:
                      - columnheader "Item" [ref=e140]
                  - rowgroup [ref=e141]:
                    - row [ref=e142]:
                      - cell "Fine Ring" [ref=e143]
                - group "Recovery this week" [ref=e144]:
                  - generic [ref=e145]:
                    - term [ref=e146]: Hospital operated
                    - definition [ref=e147]: "No"
                  - generic [ref=e148]:
                    - term [ref=e149]: Regeneration
                    - definition [ref=e150]: "+1"
              - generic [ref=e151]:
                - heading "Needs and services" [level=3] [ref=e152]
                - paragraph [ref=e153]: "Food consumed: 4 / 4 · 100%."
                - paragraph [ref=e154]: "Food unmet: 0."
                - paragraph [ref=e155]: "Goods service: 1.45 / 1.45 · 100%. Materials used once: 0 Wood, 0 Iron. Revenue: 1.45 Gold."
                - paragraph [ref=e156]: "Goods stock: opening 10 · produced 0 · distributed 1.45 · closing 8.55. Demand 1.45; unmet 0; capacity 2; limited by none."
                - paragraph [ref=e157]: "Goods unmet: 0."
              - region "Weekly stock ledger scroll area" [ref=e158]:
                - table [ref=e159]:
                  - caption [ref=e160]: Weekly stock ledger
                  - rowgroup [ref=e161]:
                    - row [ref=e162]:
                      - columnheader "Stock" [ref=e163]
                      - columnheader "Before" [ref=e164]
                      - columnheader "Stock change" [ref=e165]
                      - columnheader "After" [ref=e166]
                  - rowgroup [ref=e167]:
                    - row [ref=e168]:
                      - rowheader "gold" [ref=e169]
                      - cell "997" [ref=e170]
                      - cell "-1.45" [ref=e171]
                      - cell "995.55" [ref=e172]
                    - row [ref=e173]:
                      - rowheader "wheat" [ref=e174]
                      - cell "0" [ref=e175]
                      - cell "0" [ref=e176]
                      - cell "0" [ref=e177]
                    - row [ref=e178]:
                      - rowheader "food" [ref=e179]
                      - cell "1,000" [ref=e180]
                      - cell "-960" [ref=e181]
                      - cell "40" [ref=e182]
                    - row [ref=e183]:
                      - rowheader "wood" [ref=e184]
                      - cell "999" [ref=e185]
                      - cell "-959" [ref=e186]
                      - cell "40" [ref=e187]
                    - row [ref=e188]:
                      - rowheader "iron" [ref=e189]
                      - cell "1,000" [ref=e190]
                      - cell "-960" [ref=e191]
                      - cell "40" [ref=e192]
              - group [ref=e193]:
                - generic "Building activity" [ref=e194] [cursor=pointer]
              - region "Outside report" [ref=e195]:
                - heading "Outside" [level=3] [ref=e196]
                - paragraph [ref=e197]: "960 Food spoiled: storage full."
                - paragraph [ref=e198]: "959 Wood spoiled: storage full."
                - paragraph [ref=e199]: "960 Iron spoiled: storage full."
                - generic [ref=e200]:
                  - generic [ref=e201]:
                    - term [ref=e202]: wood produced
                    - definition [ref=e203]: "0"
                  - generic [ref=e204]:
                    - term [ref=e205]: iron produced
                    - definition [ref=e206]: "0"
                  - generic [ref=e207]:
                    - term [ref=e208]: stone produced
                    - definition [ref=e209]: "0"
                  - generic [ref=e210]:
                    - term [ref=e211]: wool produced
                    - definition [ref=e212]: "0"
                  - generic [ref=e213]:
                    - term [ref=e214]: herbs produced
                    - definition [ref=e215]: "0"
                  - generic [ref=e216]:
                    - term [ref=e217]: cloth produced
                    - definition [ref=e218]: "0"
                  - generic [ref=e219]:
                    - term [ref=e220]: stone stock before / after
                    - definition [ref=e221]: 0 / 0
                  - generic [ref=e222]:
                    - term [ref=e223]: wool stock before / after
                    - definition [ref=e224]: 0 / 0
                  - generic [ref=e225]:
                    - term [ref=e226]: cloth stock before / after
                    - definition [ref=e227]: 0 / 0
                  - generic [ref=e228]:
                    - term [ref=e229]: herbs stock before / after
                    - definition [ref=e230]: 0 / 0
          - region "Census clerk" [ref=e231]:
            - paragraph [ref=e232]: Census clerk
            - generic [ref=e234]: News
            - heading "The census is unchanged" [level=3] [ref=e235]
            - generic [ref=e236]:
              - generic [ref=e237]:
                - term [ref=e238]: Free residents
                - definition [ref=e239]: 80 → 82
              - generic [ref=e240]:
                - term [ref=e241]: Makers
                - definition [ref=e242]: 80 → 82
              - generic [ref=e243]:
                - term [ref=e244]: Luminaries
                - definition [ref=e245]: 80 → 82
              - generic [ref=e246]:
                - term [ref=e247]: Merchants
                - definition [ref=e248]: 80 → 82
            - group [ref=e249]:
              - generic "Details" [ref=e250] [cursor=pointer]
              - generic [ref=e251]:
                - heading "Population and happiness" [level=3] [ref=e252]
                - paragraph [ref=e253]: "Population: 100 → 100 · 0 arrivals · Available next week."
                - paragraph [ref=e254]: "Happiness: 80 → 82."
              - region "Society this week" [ref=e255]:
                - region "Classes this week scroll area" [ref=e256]:
                  - table [ref=e257]:
                    - caption [ref=e258]: Classes this week
                    - rowgroup [ref=e259]:
                      - row [ref=e260]:
                        - columnheader "Class" [ref=e261]
                        - columnheader "Food" [ref=e262]
                        - columnheader "Goods" [ref=e263]
                        - columnheader "Luxury" [ref=e264]
                        - columnheader "Satisfaction" [ref=e265]
                        - columnheader "Arrivals" [ref=e266]
                        - columnheader "Trained" [ref=e267]
                        - columnheader "Enslaved" [ref=e268]
                    - rowgroup [ref=e269]:
                      - row [ref=e270]:
                        - rowheader "Free residents" [ref=e271]
                        - cell "100%" [ref=e272]
                        - cell "100%" [ref=e273]
                        - cell "—" [ref=e274]
                        - cell "80 → 82" [ref=e275]
                        - cell "0" [ref=e276]
                        - cell "0" [ref=e277]
                        - cell "0" [ref=e278]
                      - row [ref=e279]:
                        - rowheader "Makers" [ref=e280]
                        - cell "100%" [ref=e281]
                        - cell "100%" [ref=e282]
                        - cell "—" [ref=e283]
                        - cell "80 → 82" [ref=e284]
                        - cell "0" [ref=e285]
                        - cell "0" [ref=e286]
                        - cell "0" [ref=e287]
                      - row [ref=e288]:
                        - rowheader "Luminaries" [ref=e289]
                        - cell "100%" [ref=e290]
                        - cell "100%" [ref=e291]
                        - cell "—" [ref=e292]
                        - cell "80 → 82" [ref=e293]
                        - cell "0" [ref=e294]
                        - cell "0" [ref=e295]
                        - cell "0" [ref=e296]
                      - row [ref=e297]:
                        - rowheader "Merchants" [ref=e298]
                        - cell "100%" [ref=e299]
                        - cell "100%" [ref=e300]
                        - cell "—" [ref=e301]
                        - cell "80 → 82" [ref=e302]
                        - cell "0" [ref=e303]
                        - cell "0" [ref=e304]
                        - cell "0" [ref=e305]
                      - row [ref=e306]:
                        - rowheader "The Bound" [ref=e307]
                        - cell "100%" [ref=e308]
                        - cell "100%" [ref=e309]
                        - cell "—" [ref=e310]
                        - cell "80 → 80" [ref=e311]
                        - cell "0" [ref=e312]
                        - cell "0" [ref=e313]
                        - cell "0" [ref=e314]
                - list [ref=e315]:
                  - listitem [ref=e316]: Some Free residents had no work, so debt pressure rose.
                  - listitem [ref=e317]: Some Luminaries had no work, so debt pressure rose.
                  - listitem [ref=e318]: Some Merchants had no work, so debt pressure rose.
                - paragraph [ref=e319]: "Bound Desperation: 0 → 0"
                - paragraph [ref=e320]: "Luxury imported: 0. Training cost: 0 Gold."
          - region "Captain of the watch" [ref=e321]:
            - paragraph [ref=e322]: Captain of the watch
            - generic [ref=e324]: News
            - heading "The streets are quiet" [level=3] [ref=e325]
            - generic [ref=e326]:
              - generic [ref=e327]:
                - term [ref=e328]: Security
                - definition [ref=e329]: 30 → 25
              - generic [ref=e330]:
                - term [ref=e331]: Crime
                - definition [ref=e332]: 10 → 5
              - generic [ref=e333]:
                - term [ref=e334]: Authority
                - definition [ref=e335]: 100 → 97
              - term [ref=e337]: "Authority 100: taxes +20%."
            - group [ref=e338]:
              - generic "Details" [active] [ref=e339] [cursor=pointer]
          - region "Word from the streets" [ref=e340]:
            - paragraph [ref=e341]: Word from the streets
            - generic [ref=e343]: News
            - heading "The streets are calm" [level=3] [ref=e344]
            - generic [ref=e345]:
              - generic [ref=e346]:
                - term [ref=e347]: Tension
                - definition [ref=e348]: 0 → 0
              - generic [ref=e349]:
                - term [ref=e350]: Desperation
                - definition [ref=e351]: 0 → 0
            - group [ref=e352]:
              - generic "Details" [ref=e353] [cursor=pointer]
        - paragraph [aria-hidden] [ref=e354]: Your steward
        - button "Plan next week" [ref=e355] [cursor=pointer]
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