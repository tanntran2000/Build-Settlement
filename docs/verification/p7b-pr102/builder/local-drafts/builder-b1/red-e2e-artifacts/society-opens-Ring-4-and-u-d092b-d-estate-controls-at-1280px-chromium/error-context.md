# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: society.spec.ts >> opens Ring 4 and uses the fixed estate controls at 1280px
- Location: tests\e2e\society.spec.ts:50:32

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: getByRole('region', { name: 'Inside City', exact: true }).getByRole('heading', { level: 4 })
Timeout: 5000ms
- Expected  - 1
+ Received  + 0

  Array [
-   "Estates",
    "Housing",
    "Services",
    "Specialist",
    "Slum",
  ]

Call log:
  - Expect "toHaveText" getByRole('region', { name: 'Inside City', exact: true }).getByRole('heading', { level: 4 }) with timeout 5000ms
  - waiting for getByRole('region', { name: 'Inside City', exact: true }).getByRole('heading', { level: 4 })
    14 × locator resolved to 4 elements

```

# Page snapshot

```yaml
- main [ref=e3]:
  - complementary "Life status and navigation" [ref=e4]:
    - navigation "Main" [ref=e5]:
      - generic [ref=e6]:
        - heading "Character Life" [level=1] [ref=e7]
        - paragraph [ref=e8]: Week 1 · Year 1 · Planning
        - paragraph [ref=e9]: Health 100 / 100 · Regen +1/week
        - button "End Week" [ref=e10] [cursor=pointer]
        - status
        - button "Information" [ref=e11] [cursor=pointer]
      - generic [ref=e12]:
        - button "Player" [ref=e13] [cursor=pointer]
        - button "Population" [ref=e14] [cursor=pointer]
      - generic [ref=e15]:
        - button "Session" [ref=e16] [cursor=pointer]
        - button "Help" [ref=e17] [cursor=pointer]
        - button "Options" [ref=e18] [cursor=pointer]
        - button "Main menu" [ref=e19] [cursor=pointer]
  - generic [ref=e20]:
    - generic [ref=e21]:
      - heading "City" [level=2] [ref=e22]
      - navigation "Views" [ref=e23]:
        - button "City" [active] [ref=e24] [cursor=pointer]
        - button "Characters" [ref=e25] [cursor=pointer]
        - button "Report" [ref=e26] [cursor=pointer]
    - region "City" [ref=e27]:
      - region "City Requirements" [ref=e28]:
        - generic [ref=e29]:
          - heading "City Requirements" [level=3] [ref=e30]
          - paragraph [ref=e31]: No resolved week yet
        - generic [ref=e32]:
          - generic [ref=e33]:
            - heading "Food" [level=4] [ref=e34]
            - group [ref=e35]:
              - generic "Food requirements" [ref=e36] [cursor=pointer]
          - generic [ref=e37]:
            - heading "Goods" [level=4] [ref=e38]
            - group [ref=e39]:
              - generic "Goods requirements" [ref=e40] [cursor=pointer]
      - region "Inside City" [ref=e41]:
        - heading "Inside City" [level=3] [ref=e42]
        - paragraph [ref=e43]: "Wall: Ring 3 of 3 · 33 / 33 plots open"
        - paragraph [ref=e44]: All wall rings are open.
        - generic [ref=e45]: Training target
        - combobox "Training target" [ref=e46]:
          - option "None" [selected]
          - option "Makers"
          - option "Luminaries"
          - option "Merchants"
        - button "Set training" [ref=e47] [cursor=pointer]
        - paragraph [ref=e48]: "Current target: None. Each operating Academy level trains up to 2 Free residents per week for 1 Gold each, while the target has housing room."
        - region "Housing" [ref=e49]:
          - heading "Housing" [level=4] [ref=e50]
          - generic [ref=e51]:
            - button "Select house-1" [ref=e52] [cursor=pointer]:
              - strong [ref=e53]: house-1
              - generic [ref=e54]: Common Housing
              - generic [ref=e56]: Level 3 · 0 WF · No staff
              - generic [ref=e57]: Enabled
              - generic [ref=e58]: Houses 70 Free residents
            - button "Select house-2" [ref=e59] [cursor=pointer]:
              - strong [ref=e60]: house-2
              - generic [ref=e61]: Makers' Rowhouses
              - generic [ref=e63]: Level 2 · 0 WF · No staff
              - generic [ref=e64]: Enabled
              - generic [ref=e65]: Houses 25 Makers
            - button "Select house-3" [ref=e66] [cursor=pointer]:
              - strong [ref=e67]: house-3
              - generic [ref=e68]: Scholars' Quarters
              - generic [ref=e70]: Level 2 · 0 WF · No staff
              - generic [ref=e71]: Enabled
              - generic [ref=e72]: Houses 18 Luminaries
            - button "Select house-4" [ref=e73] [cursor=pointer]:
              - strong [ref=e74]: house-4
              - generic [ref=e75]: Merchant Townhouses
              - generic [ref=e77]: Level 1 · 0 WF · No staff
              - generic [ref=e78]: Enabled
              - generic [ref=e79]: Houses 15 Merchants
            - button "Select house-5" [ref=e80] [cursor=pointer]:
              - strong [ref=e81]: house-5
              - generic [ref=e82]: Empty
            - button "Select house-6" [ref=e83] [cursor=pointer]:
              - strong [ref=e84]: house-6
              - generic [ref=e85]: Empty
            - button "Select house-7" [ref=e86] [cursor=pointer]:
              - strong [ref=e87]: house-7
              - generic [ref=e88]: Empty
            - button "Select house-8" [ref=e89] [cursor=pointer]:
              - strong [ref=e90]: house-8
              - generic [ref=e91]: Empty
            - button "Select house-9" [ref=e92] [cursor=pointer]:
              - strong [ref=e93]: house-9
              - generic [ref=e94]: Empty
            - button "Select house-10" [ref=e95] [cursor=pointer]:
              - strong [ref=e96]: house-10
              - generic [ref=e97]: Empty
            - button "Select house-11" [ref=e98] [cursor=pointer]:
              - strong [ref=e99]: house-11
              - generic [ref=e100]: Empty
        - region "Services" [ref=e101]:
          - heading "Services" [level=4] [ref=e102]
          - generic [ref=e103]:
            - button "Select service-1" [ref=e104] [cursor=pointer]:
              - strong [ref=e105]: service-1
              - generic [ref=e106]: Empty
            - button "Select service-2" [ref=e107] [cursor=pointer]:
              - strong [ref=e108]: service-2
              - generic [ref=e109]: Empty
            - button "Select service-3" [ref=e110] [cursor=pointer]:
              - strong [ref=e111]: service-3
              - generic [ref=e112]: Empty
            - button "Select service-4" [ref=e113] [cursor=pointer]:
              - strong [ref=e114]: service-4
              - generic [ref=e115]: Empty
            - button "Select service-5" [ref=e116] [cursor=pointer]:
              - strong [ref=e117]: service-5
              - generic [ref=e118]: Empty
            - button "Select service-6" [ref=e119] [cursor=pointer]:
              - strong [ref=e120]: service-6
              - generic [ref=e121]: Empty
        - region "Specialist" [ref=e122]:
          - heading "Specialist" [level=4] [ref=e123]
          - generic [ref=e124]:
            - button "Select spec-1" [ref=e125] [cursor=pointer]:
              - strong [ref=e126]: spec-1
              - generic [ref=e127]: Market
              - generic [ref=e129]: Level 1 · 0 WF · Merchants
              - generic [ref=e130]: Enabled
              - generic [ref=e131]: Distributes up to 2 Goods per week
            - button "Select spec-2" [ref=e132] [cursor=pointer]:
              - strong [ref=e133]: spec-2
              - generic [ref=e134]: Counting House
              - generic [ref=e136]: Level 1 · 2 WF · Merchants
              - generic [ref=e137]: Enabled
              - generic [ref=e138]: +10% tax
            - button "Select spec-3" [ref=e139] [cursor=pointer]:
              - strong [ref=e140]: spec-3
              - generic [ref=e141]: Empty
            - button "Select spec-4" [ref=e142] [cursor=pointer]:
              - strong [ref=e143]: spec-4
              - generic [ref=e144]: Empty
            - button "Select spec-5" [ref=e145] [cursor=pointer]:
              - strong [ref=e146]: spec-5
              - generic [ref=e147]: Empty
            - button "Select spec-6" [ref=e148] [cursor=pointer]:
              - strong [ref=e149]: spec-6
              - generic [ref=e150]: Empty
            - button "Select spec-7" [ref=e151] [cursor=pointer]:
              - strong [ref=e152]: spec-7
              - generic [ref=e153]: Empty
            - button "Select spec-8" [ref=e154] [cursor=pointer]:
              - strong [ref=e155]: spec-8
              - generic [ref=e156]: Empty
            - button "Select spec-9" [ref=e157] [cursor=pointer]:
              - strong [ref=e158]: spec-9
              - generic [ref=e159]: Empty
            - button "Select spec-10" [ref=e160] [cursor=pointer]:
              - strong [ref=e161]: spec-10
              - generic [ref=e162]: Empty
        - region "Slum" [ref=e163]:
          - heading "Slum" [level=4] [ref=e164]
          - generic [ref=e165]:
            - button "Select slum-1" [ref=e166] [cursor=pointer]:
              - strong [ref=e167]: slum-1
              - generic [ref=e168]: Empty
            - button "Select slum-2" [ref=e169] [cursor=pointer]:
              - strong [ref=e170]: slum-2
              - generic [ref=e171]: Empty
            - button "Select slum-3" [ref=e172] [cursor=pointer]:
              - strong [ref=e173]: slum-3
              - generic [ref=e174]: Empty
            - button "Select slum-4" [ref=e175] [cursor=pointer]:
              - strong [ref=e176]: slum-4
              - generic [ref=e177]: Empty
            - button "Select slum-5" [ref=e178] [cursor=pointer]:
              - strong [ref=e179]: slum-5
              - generic [ref=e180]: Empty
            - button "Select slum-6" [ref=e181] [cursor=pointer]:
              - strong [ref=e182]: slum-6
              - generic [ref=e183]: Empty
      - region "Library" [ref=e184]:
        - heading "Library" [level=3] [ref=e185]
        - generic [ref=e186]: Research topic
        - combobox "Research topic" [ref=e187]:
          - option "None" [selected]
          - option "Deep Mining"
          - option "Watch Patrols"
          - option "Barracks Drill"
        - button "Set research" [ref=e188] [cursor=pointer]
        - paragraph [ref=e189]: "Completed topics: None"
      - generic [ref=e190]:
        - region "Outside tiles" [ref=e191]:
          - heading "Outside tiles" [level=3] [ref=e192]
          - region "Outside Ring 1" [ref=e193]:
            - heading "Ring 1" [level=4] [ref=e194]
            - generic [ref=e195]:
              - button "Select field-1" [ref=e197] [cursor=pointer]:
                - generic [ref=e198]: fertile
                - strong [ref=e199]: field-1
                - generic [ref=e200]: Farm
                - generic [ref=e201]: Level 1 · 2 WF · Enabled
                - generic [ref=e202]: Unassigned
              - button "Select plain-1" [ref=e204] [cursor=pointer]:
                - generic [ref=e205]: plain
                - strong [ref=e206]: plain-1
                - generic [ref=e207]: Food Processor
                - generic [ref=e208]: Level 1 · 2 WF · Enabled
                - generic [ref=e209]: Unassigned
              - generic [ref=e210]:
                - button "Select forest-1" [pressed] [ref=e211] [cursor=pointer]:
                  - generic [ref=e212]: forest
                  - strong [ref=e213]: forest-1
                  - generic [ref=e214]: Empty
                  - generic [ref=e215]: No manager post
                - paragraph [ref=e216]: Wood 60 / 60
              - generic [ref=e217]:
                - button "Select ore-1" [ref=e218] [cursor=pointer]:
                  - generic [ref=e219]: ore
                  - strong [ref=e220]: ore-1
                  - generic [ref=e221]: Empty
                  - generic [ref=e222]: No manager post
                - paragraph [ref=e223]: Iron 80 / 80
              - button "Select plain-2" [ref=e225] [cursor=pointer]:
                - generic [ref=e226]: plain
                - strong [ref=e227]: plain-2
                - generic [ref=e228]: Empty
                - generic [ref=e229]: No manager post
              - button "Select plain-3" [ref=e231] [cursor=pointer]:
                - generic [ref=e232]: plain
                - strong [ref=e233]: plain-3
                - generic [ref=e234]: Empty
                - generic [ref=e235]: No manager post
              - generic [ref=e236]:
                - button "Select forest-2" [ref=e237] [cursor=pointer]:
                  - generic [ref=e238]: forest
                  - strong [ref=e239]: forest-2
                  - generic [ref=e240]: Empty
                  - generic [ref=e241]: No manager post
                - paragraph [ref=e242]: Wood 60 / 60
              - generic [ref=e243]:
                - button "Select ore-2" [ref=e244] [cursor=pointer]:
                  - generic [ref=e245]: ore
                  - strong [ref=e246]: ore-2
                  - generic [ref=e247]: Empty
                  - generic [ref=e248]: No manager post
                - paragraph [ref=e249]: Iron 80 / 80
              - button "Select field-2" [ref=e251] [cursor=pointer]:
                - generic [ref=e252]: fertile
                - strong [ref=e253]: field-2
                - generic [ref=e254]: Empty
                - generic [ref=e255]: No manager post
              - button "Select plain-4" [ref=e257] [cursor=pointer]:
                - generic [ref=e258]: plain
                - strong [ref=e259]: plain-4
                - generic [ref=e260]: Empty
                - generic [ref=e261]: No manager post
          - region "Outside Ring 2" [ref=e262]:
            - heading "Ring 2" [level=4] [ref=e263]
            - generic [ref=e264]:
              - generic [ref=e265]:
                - button "Select field-3" [ref=e266] [cursor=pointer]:
                  - generic [ref=e267]: fertile
                  - strong [ref=e268]: field-3
                  - generic [ref=e269]: Empty
                  - generic [ref=e270]: No manager post
                - paragraph [ref=e271]: Clearing 0 / 4
                - generic [ref=e272]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e273]: "0"
                - button "Clear" [ref=e274] [cursor=pointer]
              - generic [ref=e275]:
                - button "Select field-4" [ref=e276] [cursor=pointer]:
                  - generic [ref=e277]: fertile
                  - strong [ref=e278]: field-4
                  - generic [ref=e279]: Empty
                  - generic [ref=e280]: No manager post
                - paragraph [ref=e281]: Clearing 0 / 4
                - generic [ref=e282]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e283]: "0"
                - button "Clear" [ref=e284] [cursor=pointer]
              - generic [ref=e285]:
                - button "Select pasture-1" [ref=e286] [cursor=pointer]:
                  - generic [ref=e287]: pasture
                  - strong [ref=e288]: pasture-1
                  - generic [ref=e289]: Empty
                  - generic [ref=e290]: No manager post
                - paragraph [ref=e291]: Clearing 0 / 4
                - generic [ref=e292]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e293]: "0"
                - button "Clear" [ref=e294] [cursor=pointer]
              - generic [ref=e295]:
                - button "Select pasture-2" [ref=e296] [cursor=pointer]:
                  - generic [ref=e297]: pasture
                  - strong [ref=e298]: pasture-2
                  - generic [ref=e299]: Empty
                  - generic [ref=e300]: No manager post
                - paragraph [ref=e301]: Clearing 0 / 4
                - generic [ref=e302]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e303]: "0"
                - button "Clear" [ref=e304] [cursor=pointer]
              - generic [ref=e305]:
                - button "Select meadow-1" [ref=e306] [cursor=pointer]:
                  - generic [ref=e307]: meadow
                  - strong [ref=e308]: meadow-1
                  - generic [ref=e309]: Empty
                  - generic [ref=e310]: No manager post
                - paragraph [ref=e311]: Clearing 0 / 4
                - generic [ref=e312]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e313]: "0"
                - button "Clear" [ref=e314] [cursor=pointer]
              - generic [ref=e315]:
                - button "Select meadow-2" [ref=e316] [cursor=pointer]:
                  - generic [ref=e317]: meadow
                  - strong [ref=e318]: meadow-2
                  - generic [ref=e319]: Empty
                  - generic [ref=e320]: No manager post
                - paragraph [ref=e321]: Clearing 0 / 4
                - generic [ref=e322]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e323]: "0"
                - button "Clear" [ref=e324] [cursor=pointer]
              - generic [ref=e325]:
                - button "Select forest-3" [ref=e326] [cursor=pointer]:
                  - generic [ref=e327]: forest
                  - strong [ref=e328]: forest-3
                  - generic [ref=e329]: Empty
                  - generic [ref=e330]: No manager post
                - paragraph [ref=e331]: Clearing 0 / 6
                - generic [ref=e332]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e333]: "0"
                - button "Clear" [ref=e334] [cursor=pointer]
                - paragraph [ref=e335]: Wood 60 / 60
              - generic [ref=e336]:
                - button "Select rock-1" [ref=e337] [cursor=pointer]:
                  - generic [ref=e338]: rock
                  - strong [ref=e339]: rock-1
                  - generic [ref=e340]: Empty
                  - generic [ref=e341]: No manager post
                - paragraph [ref=e342]: Clearing 0 / 8
                - generic [ref=e343]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e344]: "0"
                - button "Clear" [ref=e345] [cursor=pointer]
                - paragraph [ref=e346]: Stone 100 / 100
              - generic [ref=e347]:
                - button "Select rock-2" [ref=e348] [cursor=pointer]:
                  - generic [ref=e349]: rock
                  - strong [ref=e350]: rock-2
                  - generic [ref=e351]: Empty
                  - generic [ref=e352]: No manager post
                - paragraph [ref=e353]: Clearing 0 / 8
                - generic [ref=e354]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e355]: "0"
                - button "Clear" [ref=e356] [cursor=pointer]
                - paragraph [ref=e357]: Stone 100 / 100
              - generic [ref=e358]:
                - button "Select plain-5" [ref=e359] [cursor=pointer]:
                  - generic [ref=e360]: plain
                  - strong [ref=e361]: plain-5
                  - generic [ref=e362]: Empty
                  - generic [ref=e363]: No manager post
                - paragraph [ref=e364]: Clearing 0 / 4
                - generic [ref=e365]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e366]: "0"
                - button "Clear" [ref=e367] [cursor=pointer]
          - region "Outside Ring 3" [ref=e368]:
            - heading "Ring 3" [level=4] [ref=e369]
            - generic [ref=e370]:
              - generic [ref=e371]:
                - button "Select field-5" [ref=e372] [cursor=pointer]:
                  - generic [ref=e373]: fertile
                  - strong [ref=e374]: field-5
                  - generic [ref=e375]: Empty
                  - generic [ref=e376]: No manager post
                - paragraph [ref=e377]: Clearing 0 / 4
                - generic [ref=e378]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e379]: "0"
                - button "Clear" [ref=e380] [cursor=pointer]
              - generic [ref=e381]:
                - button "Select pasture-3" [ref=e382] [cursor=pointer]:
                  - generic [ref=e383]: pasture
                  - strong [ref=e384]: pasture-3
                  - generic [ref=e385]: Empty
                  - generic [ref=e386]: No manager post
                - paragraph [ref=e387]: Clearing 0 / 4
                - generic [ref=e388]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e389]: "0"
                - button "Clear" [ref=e390] [cursor=pointer]
              - generic [ref=e391]:
                - button "Select meadow-3" [ref=e392] [cursor=pointer]:
                  - generic [ref=e393]: meadow
                  - strong [ref=e394]: meadow-3
                  - generic [ref=e395]: Empty
                  - generic [ref=e396]: No manager post
                - paragraph [ref=e397]: Clearing 0 / 4
                - generic [ref=e398]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e399]: "0"
                - button "Clear" [ref=e400] [cursor=pointer]
              - generic [ref=e401]:
                - button "Select forest-4" [ref=e402] [cursor=pointer]:
                  - generic [ref=e403]: forest
                  - strong [ref=e404]: forest-4
                  - generic [ref=e405]: Empty
                  - generic [ref=e406]: No manager post
                - paragraph [ref=e407]: Clearing 0 / 6
                - generic [ref=e408]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e409]: "0"
                - button "Clear" [ref=e410] [cursor=pointer]
                - paragraph [ref=e411]: Wood 60 / 60
              - generic [ref=e412]:
                - button "Select forest-5" [ref=e413] [cursor=pointer]:
                  - generic [ref=e414]: forest
                  - strong [ref=e415]: forest-5
                  - generic [ref=e416]: Empty
                  - generic [ref=e417]: No manager post
                - paragraph [ref=e418]: Clearing 0 / 6
                - generic [ref=e419]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e420]: "0"
                - button "Clear" [ref=e421] [cursor=pointer]
                - paragraph [ref=e422]: Wood 60 / 60
              - generic [ref=e423]:
                - button "Select ore-3" [ref=e424] [cursor=pointer]:
                  - generic [ref=e425]: ore
                  - strong [ref=e426]: ore-3
                  - generic [ref=e427]: Empty
                  - generic [ref=e428]: No manager post
                - paragraph [ref=e429]: Clearing 0 / 8
                - generic [ref=e430]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e431]: "0"
                - button "Clear" [ref=e432] [cursor=pointer]
                - paragraph [ref=e433]: Iron 80 / 80
              - generic [ref=e434]:
                - button "Select ore-4" [ref=e435] [cursor=pointer]:
                  - generic [ref=e436]: ore
                  - strong [ref=e437]: ore-4
                  - generic [ref=e438]: Empty
                  - generic [ref=e439]: No manager post
                - paragraph [ref=e440]: Clearing 0 / 8
                - generic [ref=e441]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e442]: "0"
                - button "Clear" [ref=e443] [cursor=pointer]
                - paragraph [ref=e444]: Iron 80 / 80
              - generic [ref=e445]:
                - button "Select rock-3" [ref=e446] [cursor=pointer]:
                  - generic [ref=e447]: rock
                  - strong [ref=e448]: rock-3
                  - generic [ref=e449]: Empty
                  - generic [ref=e450]: No manager post
                - paragraph [ref=e451]: Clearing 0 / 8
                - generic [ref=e452]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e453]: "0"
                - button "Clear" [ref=e454] [cursor=pointer]
                - paragraph [ref=e455]: Stone 100 / 100
              - generic [ref=e456]:
                - button "Select plain-6" [ref=e457] [cursor=pointer]:
                  - generic [ref=e458]: plain
                  - strong [ref=e459]: plain-6
                  - generic [ref=e460]: Empty
                  - generic [ref=e461]: No manager post
                - paragraph [ref=e462]: Clearing 0 / 4
                - generic [ref=e463]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e464]: "0"
                - button "Clear" [ref=e465] [cursor=pointer]
              - generic [ref=e466]:
                - button "Select plain-7" [ref=e467] [cursor=pointer]:
                  - generic [ref=e468]: plain
                  - strong [ref=e469]: plain-7
                  - generic [ref=e470]: Empty
                  - generic [ref=e471]: No manager post
                - paragraph [ref=e472]: Clearing 0 / 4
                - generic [ref=e473]: Clearing workers (WF)
                - textbox "Clearing workers (WF)" [ref=e474]: "0"
                - button "Clear" [ref=e475] [cursor=pointer]
        - region "Manage tile" [ref=e476]:
          - heading "forest-1 · forest" [level=3] [ref=e477]
          - paragraph [ref=e478]: Empty tile. Choose a compatible building.
          - paragraph [ref=e479]: Replace pays full cost and resets level and workers; no refund
          - generic [ref=e480]: Building type
          - combobox "Building type" [ref=e481]:
            - option "Sheep Pasture"
            - option "Herb Garden"
            - option "Quarry"
            - option "Weaver"
            - option "Farm"
            - option "Food Processor"
            - option "Logging Camp" [selected]
            - option "Iron Mine"
            - option "Goods Workshop"
          - paragraph [ref=e482]: "Requires forest terrain. Cost: 2 Gold, 0 Wood, 0 Iron. Upkeep: 0.5 Gold/week at level 1."
          - button "Build" [ref=e483] [cursor=pointer]
      - group [ref=e484]:
        - generic "Planning settings" [ref=e485] [cursor=pointer]
      - region "Outside world" [ref=e486]:
        - group [ref=e487]:
          - generic "Outside world" [ref=e488] [cursor=pointer]
```

# Test source

```ts
  1  | import {storedSaveText,readStoredRecords,writeStoredSaveText,writeRawRecord,clearStored,storeMarks,resetStoreMarks,injectWriteAbort} from './storage.helpers.ts';
  2  | import {test,expect,type Page} from '@playwright/test';
  3  | import {readFile} from 'node:fs/promises';
  4  | import {societyPopulation,createWorldSession} from '../../packages/core/src/index.ts';
  5  | import {serializeWorldSessionSave} from '../../packages/persistence/src/world-session-save.ts';
  6  | import {executeCharacterLifeCommand} from '../../packages/simulation/src/character-life-command.ts';
  7  | import {openReportDetails,makeLife,importLife,exportLife,go,selectPerson,selectArea,characterWindow,keyActivate} from './character-life-navigation.helpers.ts';
  8  | const OLD='This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
  9  | const key='haven.character-life-session-society.checkpoint.v1';
  10 | const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
  11 | async function start(page:Page){await page.goto('/');await importLife(page,makeLife(20261028));}
  12 | async function population(page:Page){await go(page,'city');await page.locator('#life-nav-population').click();return page.getByRole('dialog',{name:'Population',exact:true});}
  13 | function rich(){const s=makeLife(20261028);Object.assign(s.city.world.settlements[s.city.world.activeSettlementId!].inventory,{gold:200000,wood:100000,iron:50000});return s;}
  14 | for(const url of ['/','/?mode=weekly','/?mode=tiles','/?mode=population','/?mode=world','/?mode=world-npc','/?mode=world-life']){
  15 |  test(`one society New Game at ${url}`,async({page})=>{
  16 |   await page.goto(url);await expect(button(page,'New Game')).toBeVisible();await button(page,'New Game').click();await page.getByLabel('Name',{exact:true}).fill('Synthetic Keeper');await page.getByRole('tab',{name:'Review',exact:true}).click();await button(page,'Create character').click();
  17 |   const saved=await exportLife(page);expect(saved.city.society!.rulesetId).toBe('tile-society-10');
  18 |   const dialog=await population(page);
  19 |   for(const [id,count,limit] of [['free',55,70],['makers',20,25],['luminaries',12,18],['merchants',13,15],['bound',0,0]] as const){const row=dialog.getByTestId(`society-class-${id}`);await expect(row).toContainText(`Count: ${count}`);await expect(row).toContainText('Satisfaction: 80 / 100');await expect(row).toContainText(`Housing (planned): ${count} / ${limit}`);}
  20 |  });
  21 | }
  22 | test('tier lists and locked plots enforce the engine rules',async({page})=>{
  23 |  await start(page);await go(page,'city');
  24 |  for(const id of ['house-1','house-2','house-3','house-4']){await page.getByTestId(`trial-tile-${id}`).click();await expect(page.getByLabel('Building type').locator('option[value="makers-rowhouses"]')).toHaveCount(1);}
  25 |  await page.getByTestId('trial-tile-service-1').click();await expect(page.getByLabel('Building type').locator('option[value="makers-rowhouses"]')).toHaveCount(0);await expect(page.getByLabel('Building type').locator('option[value="watch-house"]')).toBeEnabled();await expect(page.getByTestId('trial-tile-house-5')).toHaveCount(0);await expect(page.getByText('Locked · opens with Ring 2',{exact:true}).first()).toBeVisible();
  26 |  const s=makeLife(),before=structuredClone(s);expect(executeCharacterLifeCommand(s,{type:'BUILD',tileId:'service-1',typeId:'makers-rowhouses',expectedRevision:0}).success).toBe(false);expect(s).toEqual(before);
  27 | });
  28 | test('Builders Yard opens Ring 2 and its plots',async({page})=>{
  29 |  const s=rich();s.city.tiles.find(t=>t.id==='plain-1')!.building!.workers=0;await page.goto('/');await importLife(page,s);await page.getByTestId('trial-tile-spec-2').click();await page.getByLabel('Building type').selectOption('builders-yard');await button(page,'Build').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('2');await button(page,'Assign workers').click();await button(page,'Extend wall to Ring 2').click();await expect(page.getByText('Wall: Ring 2 of 3 · 22 / 33 plots open',{exact:true})).toBeVisible();await expect(page.getByTestId('trial-tile-house-5')).toBeVisible();
  30 | });
  31 | test('Academy trains exactly two residents each of two weeks',async({page})=>{
  32 |  const s=rich();s.city.society!.classes.luminaries.common=20;s.city.world.settlements[s.city.world.activeSettlementId!].cohorts.find(c=>c.id==='weekly_middle')!.count=societyPopulation(s.city.society!);await page.goto('/');await importLife(page,s);await page.getByTestId('trial-tile-spec-2').click();await page.getByLabel('Building type').selectOption('academy');await button(page,'Build').click();await page.getByLabel('Assigned workers (WF)',{exact:true}).fill('2');await button(page,'Assign workers').click();await page.getByLabel('Training target').selectOption('makers');await button(page,'Set training').click();
  33 |  for(let week=0;week<2;week++){const before=await exportLife(page);await page.getByTestId('life-end-week').click();await openReportDetails(page,'census');await expect(page.getByTestId('society-report-makers').getByRole('cell').nth(5)).toHaveText('2');await button(page,'Plan next week').click();const after=await exportLife(page);expect(before.city.society!.classes.free-after.city.society!.classes.free).toBe(2);expect(after.city.society!.classes.makers.common-before.city.society!.classes.makers.common).toBe(2);}
  34 | });
  35 | test('hungry Bound report matches the seeded executor result',async({page})=>{
  36 |  const s=rich();s.city.society!.classes.bound.free=20;const settlement=s.city.world.settlements[s.city.world.activeSettlementId!];settlement.inventory.food=0;settlement.cohorts[0].count=societyPopulation(s.city.society!);const expected=executeCharacterLifeCommand(s,{type:'END_WEEK',expectedRevision:0,expectedWeek:1});if(!expected.success)throw Error(expected.error.message);await page.goto('/');await importLife(page,s);await page.getByTestId('life-end-week').click();await openReportDetails(page,'census');await expect(page.getByTestId('society-why')).toContainText('The Bound went short of Food.');await expect(page.getByText(`Bound Desperation: 0 → ${expected.next.city.society!.desperation}`,{exact:true})).toBeVisible();expect(expected.next.city.society!.desperation).toBeGreaterThan(0);
  37 | });
  38 | test('one slot round-trips and rejects older or other-mode imports atomically',async({page})=>{
  39 |  await page.goto('/');const oldKeys=['haven.character-life-session.checkpoint.v1','haven.character-life-session-goods.checkpoint.v1'];const oldFiles=await Promise.all(['legacy-v1','goods-v1'].map(v=>OLD_CHECKPOINT_BYTES[`${v}/life.json` as keyof typeof OLD_CHECKPOINT_BYTES]));await page.evaluate(({keys,files})=>keys.forEach((k,i)=>localStorage.setItem(k,files[i])),{keys:oldKeys,files:oldFiles});await expect(button(page,'Continue')).toBeDisabled();await expect(page.getByText('No local checkpoint',{exact:true})).toContainText('No local checkpoint');await importLife(page,makeLife());await go(page,'session');await button(page,'Save locally').click();
  40 |  await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toContainText('Saved in this browser.');
  41 |  const saved=await exportLife(page);expect(await storedSaveText(page)).not.toBeNull();await page.reload();await button(page,'Continue').click();expect(await exportLife(page)).toEqual(saved);
  42 |  const world=createWorldSession(1);if(!world.success)throw Error();const foreign=serializeWorldSessionSave(world.value);if(!foreign.success)throw Error();
  43 |  for(const text of [...oldFiles,foreign.text]){await go(page,'session');await page.getByLabel('Import checkpoint',{exact:true}).setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(text)});await expect(page.getByRole('alert')).toHaveText(OLD);expect(await exportLife(page)).toEqual(saved);}
  44 |  expect(await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),oldKeys)).toEqual(oldFiles);
  45 |  await page.getByTestId('life-end-week').click();await button(page,'Plan next week').click();await importLife(page,saved);await go(page,'reports');await expect(page.getByText('No resolved week yet',{exact:true}).last()).toBeVisible();
  46 | });
  47 | for(const width of [375,1280])test(`navigation preserves bytes and full-ring layout at ${width}px`,async({page})=>{
  48 |  await page.setViewportSize({width,height:width===375?812:900});const s=rich();s.city.society!.wallRing=3;await page.goto('/');await importLife(page,s);const before=JSON.stringify(await exportLife(page));await go(page,'city');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const id of ['population','information','report']){if(id==='report')await go(page,'reports');else await page.locator(`#life-nav-${id}`).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(id==='report')await go(page,'city');else await button(page,'Close').click();}expect(JSON.stringify(await exportLife(page))).toBe(before);await page.getByTestId('life-end-week').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  49 | });
  50 | for(const width of [1280,1600])test(`opens Ring 4 and uses the fixed estate controls at ${width}px`,async({page})=>{
  51 |  await page.setViewportSize({width,height:900});
  52 |  const s=rich(),society=s.city.society!,settlement=s.city.world.settlements[s.city.world.activeSettlementId!];
  53 |  society.wallRing=3;society.classes.merchants.common=20;society.stocksMilli.stone=45000;
  54 |  settlement.cohorts.find(c=>c.id==='weekly_middle')!.count=societyPopulation(society);
  55 |  s.city.tiles.find(t=>t.id==='spec-2')!.building={typeId:'counting-house',level:1,workers:2,enabled:true};
  56 |  await page.goto('/');await importLife(page,s);await go(page,'city');
  57 |  const inside=page.getByRole('region',{name:'Inside City',exact:true});
> 58 |  await expect(inside.getByRole('heading',{level:4})).toHaveText(['Estates','Housing','Services','Specialist','Slum']);
     |                                                      ^ Error: expect(locator).toHaveText(expected) failed
  59 |  const estate=inside.getByRole('region',{name:'Estates',exact:true});
  60 |  await expect(estate.locator('#trial-building-name-estate-1')).toHaveText('Mansion');
  61 |  await expect(estate.locator('#trial-building-name-estate-2')).toHaveText("Retainers' Hall");
  62 |  await keyActivate(page,estate.getByTestId('trial-tile-estate-1'));
  63 |  const manage=page.getByRole('region',{name:'Manage tile',exact:true});
  64 |  await expect(manage.getByText('This estate is fixed. You can only upgrade its building.',{exact:true})).toBeVisible();
  65 |  await expect(manage.getByRole('button',{name:'Upgrade',exact:true})).toBeEnabled();
  66 |  for(const name of ['Build','Replace','Pause','Assign workers'])await expect(manage.getByRole('button',{name,exact:true})).toHaveCount(0);
  67 |  await expect(inside.getByTestId('trial-tile-house-12')).toHaveCount(0);
  68 |  await expect(inside.locator('[data-inside-plot="house-12"]').getByText('Locked · opens with Ring 4',{exact:true})).toBeVisible();
  69 |  await keyActivate(page,button(page,'Extend wall to Ring 4'));
  70 |  await expect(inside.getByText('Wall: Ring 4 of 4 · 43 / 43 plots open',{exact:true})).toBeVisible();
  71 |  await expect(inside.getByText('All wall rings are open.',{exact:true})).toBeVisible();
  72 |  await keyActivate(page,inside.getByTestId('trial-tile-house-12'));
  73 |  await expect(manage.getByRole('heading',{name:'house-12 · town',exact:true})).toBeVisible();
  74 |  const after=await exportLife(page);
  75 |  expect(after.city.society!.stocksMilli.stone).toBe(0);
  76 |  expect(after.city.world.settlements[after.city.world.activeSettlementId!].inventory).toStrictEqual({gold:100000,wheat:0,food:20000,wood:40000,iron:20000});
  77 |  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  78 | });
  79 | test('NPC choices include the inside Market and a built Town Hall',async({page})=>{
  80 |  const s=rich();await page.goto('/');await importLife(page,s);await selectPerson(page,'npc_starter_1');await selectArea(page,'Work');await expect(characterWindow(page).getByLabel('Manager post',{exact:false}).locator('option[value="spec-1"]')).toHaveCount(1);await go(page,'city');await page.getByTestId('trial-tile-service-1').click();await page.getByLabel('Building type').selectOption('town-hall');await button(page,'Build').click();await selectPerson(page,'npc_starter_1');await selectArea(page,'Work');await expect(characterWindow(page).getByLabel('Manager post',{exact:false}).locator('option[value="service-1"]')).toHaveCount(1);
  81 | });
  82 | 
  83 | const OLD_CHECKPOINT_BYTES = {"legacy-v1/life.json":"{\"format\":\"haven.character-life-session.save\",\"schemaVersion\":1,\"cityRulesetId\":\"tile-population-01\",\"state\":{\"city\":{\"world\":{\"week\":1,\"worldMetadata\":{\"worldSeed\":2026,\"gameVersion\":\"0.1.0\"},\"activeSettlementId\":\"settlement_haven_01\",\"settlements\":{\"settlement_haven_01\":{\"id\":\"settlement_haven_01\",\"name\":\"Haven\",\"status\":\"active\",\"foodProcessorOperational\":true,\"inventory\":{\"gold\":30000,\"wheat\":0,\"food\":4000,\"wood\":8000,\"iron\":4000},\"cohorts\":[{\"id\":\"weekly_middle\",\"occupation\":\"worker\",\"socialClass\":\"common\",\"legalStatus\":\"citizen\",\"count\":100,\"averageHealth\":80,\"morale\":80,\"productivity\":80,\"resentment\":0,\"loyalty\":80,\"livingStandard\":\"decent\"}]}}},\"revision\":0,\"phase\":\"planning\",\"tiles\":[{\"id\":\"field-1\",\"terrain\":\"fertile\",\"building\":{\"typeId\":\"farm\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"plain-1\",\"terrain\":\"plain\",\"building\":{\"typeId\":\"processor\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"forest-1\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-1\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"plain-2\",\"terrain\":\"plain\",\"building\":null},{\"id\":\"plain-3\",\"terrain\":\"plain\",\"building\":null},{\"id\":\"forest-2\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-2\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"field-2\",\"terrain\":\"fertile\",\"building\":null},{\"id\":\"plain-4\",\"terrain\":\"plain\",\"building\":null}],\"happiness\":80},\"outside\":{\"scenarioId\":\"outside-trial-01\",\"generator\":\"outside-gen-01\",\"seed\":20261028,\"actors\":[\"player\",\"ai-1\",\"ai-2\"],\"tiles\":[{\"id\":\"o01\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o02\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o03\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o04\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o05\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o06\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o07\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o08\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o09\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o10\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o11\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o12\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o13\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o14\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o15\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o16\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o17\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o18\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o19\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o20\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o21\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o22\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o23\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o24\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o25\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o26\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o27\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o28\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o29\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o30\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o31\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o32\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o33\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o34\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o35\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o36\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o37\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o38\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o39\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o40\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o41\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o42\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o43\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o44\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o45\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o46\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o47\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o48\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o49\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o50\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o51\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o52\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o53\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o54\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o55\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o56\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o57\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o58\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o59\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o60\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o61\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o62\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o63\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o64\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o65\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o66\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o67\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o68\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o69\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o70\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o71\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o72\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o73\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o74\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o75\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o76\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o77\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o78\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o79\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o80\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o81\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o82\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o83\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o84\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o85\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o86\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o87\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o88\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o89\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o90\",\"owner\":null,\"knownBy\":[],\"feature\":null}]},\"npcs\":[{\"character\":{\"id\":\"npc_starter_1\",\"name\":\"Lydia\",\"gender\":\"female\",\"age\":27,\"occupation\":\"technician\",\"socialClass\":\"skilled\",\"legalStatus\":\"citizen\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":40,\"technical\":65,\"medical\":15,\"combat\":30,\"negotiation\":25},\"health\":100},\"traits\":[\"frugal\",\"restless\"],\"postTileId\":null},{\"character\":{\"id\":\"npc_starter_2\",\"name\":\"Tessa\",\"gender\":\"female\",\"age\":31,\"occupation\":\"doctor\",\"socialClass\":\"skilled\",\"legalStatus\":\"free_resident\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":35,\"technical\":20,\"medical\":65,\"combat\":10,\"negotiation\":45},\"health\":85},\"traits\":[\"steady_hands\"],\"postTileId\":null},{\"character\":{\"id\":\"npc_starter_3\",\"name\":\"Wendy\",\"gender\":\"female\",\"age\":24,\"occupation\":\"trader\",\"socialClass\":\"common\",\"legalStatus\":\"contract_bound\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":50,\"technical\":15,\"medical\":20,\"combat\":35,\"negotiation\":60},\"health\":100},\"traits\":[\"blunt\"],\"postTileId\":null}],\"player\":{\"character\":{\"id\":\"player\",\"name\":\"Synthetic Keeper\",\"gender\":\"other\",\"age\":25,\"occupation\":\"worker\",\"socialClass\":\"common\",\"legalStatus\":\"citizen\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":30,\"technical\":30,\"medical\":20,\"combat\":20,\"negotiation\":30},\"health\":100},\"profile\":{\"id\":\"player\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"they\",\"birthplaceId\":\"kestrel_ford\",\"origin\":{\"regionId\":\"northreach\",\"upbringing\":\"frontier\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":50,\"learningAptitude\":50,\"warmth\":50},\"appearance\":{\"presentation\":\"androgynous\",\"skinTone\":\"olive\",\"eyeColor\":\"brown\",\"hair\":{\"color\":\"dark_brown\",\"length\":\"short\",\"texture\":\"straight\",\"style\":\"loose\"},\"face\":{\"shape\":\"oval\",\"features\":[]},\"build\":\"average\",\"heightCm\":170,\"weightKg\":68,\"outfit\":\"role_default\"}}},\"profiles\":[{\"id\":\"npc_starter_1\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"kestrel_ford\",\"origin\":{\"regionId\":\"northreach\",\"upbringing\":\"frontier\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":66,\"learningAptitude\":72,\"warmth\":34},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"light_olive\",\"eyeColor\":\"grey\",\"hair\":{\"color\":\"brown\",\"length\":\"shoulder_length\",\"texture\":\"straight\",\"style\":\"tied_back\"},\"face\":{\"shape\":\"oval\",\"features\":[\"freckles\"]},\"build\":\"slim\",\"heightCm\":168,\"weightKg\":58,\"outfit\":\"role_default\"}},{\"id\":\"npc_starter_2\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"tidewall\",\"origin\":{\"regionId\":\"saltmere\",\"upbringing\":\"port_town\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":50,\"learningAptitude\":55,\"warmth\":78},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"deep_brown\",\"eyeColor\":\"brown\",\"hair\":{\"color\":\"black\",\"length\":\"short\",\"texture\":\"straight\",\"style\":\"loose\"},\"face\":{\"shape\":\"heart_shaped\",\"features\":[\"glasses\"]},\"build\":\"average\",\"heightCm\":174,\"weightKg\":70,\"outfit\":\"role_default\"}},{\"id\":\"npc_starter_3\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"cinder_hollow\",\"origin\":{\"regionId\":\"ashfield\",\"upbringing\":\"city\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":72,\"learningAptitude\":48,\"warmth\":45},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"fair\",\"eyeColor\":\"green\",\"hair\":{\"color\":\"red\",\"length\":\"long\",\"texture\":\"wavy\",\"style\":\"braided\"},\"face\":{\"shape\":\"round\",\"features\":[\"high_cheekbones\"]},\"build\":\"slim\",\"heightCm\":162,\"weightKg\":55,\"outfit\":\"role_default\"}}]}}","goods-v1/life.json":"{\"format\":\"haven.character-life-session.save\",\"schemaVersion\":1,\"cityRulesetId\":\"tile-population-goods-01\",\"state\":{\"city\":{\"world\":{\"week\":1,\"worldMetadata\":{\"worldSeed\":2026,\"gameVersion\":\"0.1.0\"},\"activeSettlementId\":\"settlement_haven_01\",\"settlements\":{\"settlement_haven_01\":{\"id\":\"settlement_haven_01\",\"name\":\"Haven\",\"status\":\"active\",\"foodProcessorOperational\":true,\"inventory\":{\"gold\":45000,\"wheat\":0,\"food\":20000,\"wood\":8000,\"iron\":4000},\"cohorts\":[{\"id\":\"weekly_middle\",\"occupation\":\"worker\",\"socialClass\":\"common\",\"legalStatus\":\"citizen\",\"count\":100,\"averageHealth\":80,\"morale\":80,\"productivity\":80,\"resentment\":0,\"loyalty\":80,\"livingStandard\":\"decent\"}]}}},\"revision\":0,\"phase\":\"planning\",\"tiles\":[{\"id\":\"field-1\",\"terrain\":\"fertile\",\"building\":{\"typeId\":\"farm\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"plain-1\",\"terrain\":\"plain\",\"building\":{\"typeId\":\"processor\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"forest-1\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-1\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"plain-2\",\"terrain\":\"plain\",\"building\":{\"typeId\":\"market\",\"level\":1,\"workers\":0,\"enabled\":true}},{\"id\":\"plain-3\",\"terrain\":\"plain\",\"building\":null},{\"id\":\"forest-2\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-2\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"field-2\",\"terrain\":\"fertile\",\"building\":null},{\"id\":\"plain-4\",\"terrain\":\"plain\",\"building\":null}],\"happiness\":80,\"goodsStock\":{\"rulesetId\":\"tile-population-goods-01\",\"amountMilli\":10000}},\"outside\":{\"scenarioId\":\"outside-trial-01\",\"generator\":\"outside-gen-01\",\"seed\":20261028,\"actors\":[\"player\",\"ai-1\",\"ai-2\"],\"tiles\":[{\"id\":\"o01\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o02\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o03\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o04\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o05\",\"owner\":\"ai-1\",\"knownBy\":[\"ai-1\"],\"feature\":null},{\"id\":\"o06\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o07\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o08\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o09\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o10\",\"owner\":\"ai-2\",\"knownBy\":[\"ai-2\"],\"feature\":null},{\"id\":\"o11\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o12\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o13\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o14\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o15\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o16\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o17\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o18\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o19\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o20\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o21\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o22\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o23\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o24\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o25\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o26\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o27\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o28\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o29\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o30\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o31\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o32\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o33\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o34\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o35\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o36\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o37\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o38\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o39\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o40\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o41\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o42\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o43\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o44\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o45\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o46\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o47\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o48\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o49\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o50\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o51\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o52\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o53\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o54\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o55\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o56\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o57\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o58\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o59\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"iron\"}},{\"id\":\"o60\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o61\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o62\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o63\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o64\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o65\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o66\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o67\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o68\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o69\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o70\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o71\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o72\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o73\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o74\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o75\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o76\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o77\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o78\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o79\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o80\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o81\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o82\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o83\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o84\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o85\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o86\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o87\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"deposit\",\"resource\":\"wood\"}},{\"id\":\"o88\",\"owner\":null,\"knownBy\":[],\"feature\":null},{\"id\":\"o89\",\"owner\":null,\"knownBy\":[],\"feature\":{\"kind\":\"loot\",\"claimedBy\":null}},{\"id\":\"o90\",\"owner\":null,\"knownBy\":[],\"feature\":null}]},\"npcs\":[{\"character\":{\"id\":\"npc_starter_1\",\"name\":\"Lydia\",\"gender\":\"female\",\"age\":27,\"occupation\":\"technician\",\"socialClass\":\"skilled\",\"legalStatus\":\"citizen\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":40,\"technical\":65,\"medical\":15,\"combat\":30,\"negotiation\":25},\"health\":100},\"traits\":[\"frugal\",\"restless\"],\"postTileId\":null},{\"character\":{\"id\":\"npc_starter_2\",\"name\":\"Tessa\",\"gender\":\"female\",\"age\":31,\"occupation\":\"doctor\",\"socialClass\":\"skilled\",\"legalStatus\":\"free_resident\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":35,\"technical\":20,\"medical\":65,\"combat\":10,\"negotiation\":45},\"health\":85},\"traits\":[\"steady_hands\"],\"postTileId\":null},{\"character\":{\"id\":\"npc_starter_3\",\"name\":\"Wendy\",\"gender\":\"female\",\"age\":24,\"occupation\":\"trader\",\"socialClass\":\"common\",\"legalStatus\":\"contract_bound\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":50,\"technical\":15,\"medical\":20,\"combat\":35,\"negotiation\":60},\"health\":100},\"traits\":[\"blunt\"],\"postTileId\":null}],\"player\":{\"character\":{\"id\":\"player\",\"name\":\"Synthetic Keeper\",\"gender\":\"other\",\"age\":25,\"occupation\":\"worker\",\"socialClass\":\"common\",\"legalStatus\":\"citizen\",\"needs\":{\"safety\":70,\"nutrition\":80,\"autonomy\":60,\"recognition\":50,\"intimacy\":40,\"purpose\":50},\"emotions\":{\"joy\":50,\"fear\":10,\"anger\":0,\"sadness\":10,\"shame\":0,\"jealousy\":0,\"hope\":70,\"stress\":20},\"relationshipToPlayer\":{\"trust\":30,\"affection\":20,\"attraction\":10,\"respect\":30,\"fear\":10,\"resentment\":0,\"dependency\":20,\"familiarity\":10},\"memories\":[],\"skills\":{\"management\":30,\"technical\":30,\"medical\":20,\"combat\":20,\"negotiation\":30},\"health\":100},\"profile\":{\"id\":\"player\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"they\",\"birthplaceId\":\"kestrel_ford\",\"origin\":{\"regionId\":\"northreach\",\"upbringing\":\"frontier\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":50,\"learningAptitude\":50,\"warmth\":50},\"appearance\":{\"presentation\":\"androgynous\",\"skinTone\":\"olive\",\"eyeColor\":\"brown\",\"hair\":{\"color\":\"dark_brown\",\"length\":\"short\",\"texture\":\"straight\",\"style\":\"loose\"},\"face\":{\"shape\":\"oval\",\"features\":[]},\"build\":\"average\",\"heightCm\":170,\"weightKg\":68,\"outfit\":\"role_default\"}}},\"profiles\":[{\"id\":\"npc_starter_1\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"kestrel_ford\",\"origin\":{\"regionId\":\"northreach\",\"upbringing\":\"frontier\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":66,\"learningAptitude\":72,\"warmth\":34},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"light_olive\",\"eyeColor\":\"grey\",\"hair\":{\"color\":\"brown\",\"length\":\"shoulder_length\",\"texture\":\"straight\",\"style\":\"tied_back\"},\"face\":{\"shape\":\"oval\",\"features\":[\"freckles\"]},\"build\":\"slim\",\"heightCm\":168,\"weightKg\":58,\"outfit\":\"role_default\"}},{\"id\":\"npc_starter_2\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"tidewall\",\"origin\":{\"regionId\":\"saltmere\",\"upbringing\":\"port_town\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":50,\"learningAptitude\":55,\"warmth\":78},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"deep_brown\",\"eyeColor\":\"brown\",\"hair\":{\"color\":\"black\",\"length\":\"short\",\"texture\":\"straight\",\"style\":\"loose\"},\"face\":{\"shape\":\"heart_shaped\",\"features\":[\"glasses\"]},\"build\":\"average\",\"heightCm\":174,\"weightKg\":70,\"outfit\":\"role_default\"}},{\"id\":\"npc_starter_3\",\"identity\":{\"birthName\":null,\"label\":null,\"pronouns\":\"she\",\"birthplaceId\":\"cinder_hollow\",\"origin\":{\"regionId\":\"ashfield\",\"upbringing\":\"city\"},\"currentLocationId\":\"haven\",\"biography\":null},\"traits\":{\"attractiveness\":72,\"learningAptitude\":48,\"warmth\":45},\"appearance\":{\"presentation\":\"feminine\",\"skinTone\":\"fair\",\"eyeColor\":\"green\",\"hair\":{\"color\":\"red\",\"length\":\"long\",\"texture\":\"wavy\",\"style\":\"braided\"},\"face\":{\"shape\":\"round\",\"features\":[\"high_cheekbones\"]},\"build\":\"slim\",\"heightCm\":162,\"weightKg\":55,\"outfit\":\"role_default\"}}]}}","legacy-v1/population.json":"{\"format\":\"haven.tile-trial.save\",\"schemaVersion\":1,\"rulesetId\":\"tile-population-01\",\"state\":{\"world\":{\"week\":1,\"worldMetadata\":{\"worldSeed\":2026,\"gameVersion\":\"0.1.0\"},\"activeSettlementId\":\"settlement_haven_01\",\"settlements\":{\"settlement_haven_01\":{\"id\":\"settlement_haven_01\",\"name\":\"Haven\",\"status\":\"active\",\"foodProcessorOperational\":true,\"inventory\":{\"gold\":30000,\"wheat\":0,\"food\":4000,\"wood\":8000,\"iron\":4000},\"cohorts\":[{\"id\":\"weekly_middle\",\"occupation\":\"worker\",\"socialClass\":\"common\",\"legalStatus\":\"citizen\",\"count\":100,\"averageHealth\":80,\"morale\":80,\"productivity\":80,\"resentment\":0,\"loyalty\":80,\"livingStandard\":\"decent\"}]}}},\"revision\":0,\"phase\":\"planning\",\"tiles\":[{\"id\":\"field-1\",\"terrain\":\"fertile\",\"building\":{\"typeId\":\"farm\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"plain-1\",\"terrain\":\"plain\",\"building\":{\"typeId\":\"processor\",\"level\":1,\"workers\":2,\"enabled\":true}},{\"id\":\"forest-1\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-1\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"plain-2\",\"terrain\":\"plain\",\"building\":null},{\"id\":\"plain-3\",\"terrain\":\"plain\",\"building\":null},{\"id\":\"forest-2\",\"terrain\":\"forest\",\"building\":null},{\"id\":\"ore-2\",\"terrain\":\"ore\",\"building\":null},{\"id\":\"field-2\",\"terrain\":\"fertile\",\"building\":null},{\"id\":\"plain-4\",\"terrain\":\"plain\",\"building\":null}],\"happiness\":80}}"};
  84 | 
```