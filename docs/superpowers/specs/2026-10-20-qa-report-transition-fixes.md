# QA report transition and presentation corrections

Base main `039fc82f80d16a5fb7e1bf784d279785b78fd1e4`. User Sentinel_1436891d7f6081919aeba13f45584108 approved fixing the reported Medium double-click and two Low presentation/documentation findings with regressions. No UI overhaul or gameplay/balance changes.

Root cause: removing the report on NEXT_WEEK collapses the page and scroll position. A second pointer click can hit the newly exposed End Week button, issuing a valid new command and processing an unwanted week. Fix the geometry/lifetime of the existing report card: retain only the latest UI-local report during Planning, explicitly label it previous, and keep its Plan next week button mounted but disabled until the next report. The intentional End Week action remains immediately available. No time-based debounce, swallowed legitimate keyboard input, clock/revision change or simulation guard workaround.

LOAD_TRIAL clears the UI-local report as before. Report-phase export/import and management stay disabled; planning management and checkpoint IO remain enabled even while the previous report is visible. Only the latest report exists, never history; it is not saved or used for simulation. Reload resets it. Error/notice changes and cancel/import flows must not replay economics.

Classic static preview must describe five physical stocks, finished Food and Goods as a city-wide service Requirement without Goods inventory. Clarify that the classic mode does not simulate Requirements/Status, while the separate tile trial partially does. Preserve the three-group descriptors and deferred Law; do not broaden to new Status UI or edit classic/R1 simulation, save schema or numeric catalog.

Record PR30 manual-checkpoint subset released at039fc82, candidate757570c, required mainCI39407997417 PASS683unit43browser. Keep full R3, autosave/cloud/migration/NG+ and deferred gameplay open; retain earlier checkpoint history.

Export burst diagnosis: game and minimal Blob/anchor control both create12 URLs in<1s but Chromium153 starts10; CDP and Playwright agree, next click after1500ms succeeds. Browser-layer limitation in this environment, not confirmed app defect. No export code change. Evidence /tmp/main-qa-20261020/export-diagnosis/REPORT.md is local scratch, not a published repository artifact.

Acceptance: original mouse double-click reproduction fails before fix, then retains Week2Planning and unchanged stocks; repeated keyboard activation and touch taps at the previous button position cannot process another week. A deliberate End Week immediately resolves exactly once. Error/cancel/invalid import preserve game; checkpoint import clears previous report and continuation economics remain unchanged. Desktop/mobile browser and actual standalone offline HTML must be checked. All existing gates and independent Reviewer/Tester inspect exact final candidate before normal authorized repository integration. No new Library upload without delivery authorization.
