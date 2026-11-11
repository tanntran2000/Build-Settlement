# Owner approval record: End Week double-click guard (PR #89, commit `c38642b`)

## Where the approvals come from

The owner (Tân) gave these approvals in the Claude desktop session `e7d04773-dfa7-4a71-9bc5-09bb6a13d94b`, whose transcript is stored on the owner's machine.

- Each decision was a question box that Claude showed: a one-line question, two answer buttons, and a status recap.
- The owner answered by clicking a button or typing a message.
- Below, quoted exactly from the transcript, are each question, its buttons, the owner's reply, the UTC timestamps and the transcript message ids.
- The transcript is not published, so the owner can confirm these lines directly in the T3 coordination thread if needed.

## 1. Target devices, before the fix

- **Question shown:** 2026-11-11T08:15:40Z, "Which fix for the End Week double-click bug?"
- **Buttons:** "Repeat-click guard" / "2×2 grid on mobile"
- **Recap shown:** "PR B is paused at B3 on a 375 px bug, cause measured: the taller sidebar pushes the Report heading below the screen, focus scrolls the page, and the 2nd click of a double-click hits Help. B1 and B2 are committed; B3 is green but uncommitted."
- **Owner reply:** 2026-11-11T08:16:59.803Z, message `8e0a0e8a-8d07-433a-a2fd-2808f38db344`, typed: "trước mắt làm chuẩn bản cho PC hoặc laptop đi còn về việc chơi trên đt tính sau"
- **Meaning:** design for PC/laptop first and defer phone layouts. The 2×2 phone-grid option was therefore dropped.

## 2. "Use the guard"

- **Question shown:** 2026-11-11T08:17:46Z, "Fix PR B's 375 px failure with the repeat-click guard?"
- **Buttons:** "Use the guard" / "Skip the 375px test"
- **Recap shown:** "Saved your direction: PC/laptop first, phone later. PR B is still paused at B3: the existing 375 px test fails, and CI cannot be left red or have that test skipped without your explicit OK. B1 and B2 are committed."
- **Claude's message shown with it** (Vietnamese, summarised): option 1, the guard, ignores the second press of the same double-click for about half a second after End Week, wherever it lands. It is about 5 lines in `CharacterLifeShell.svelte`, with no layout change, and the existing 375 px test turns green again. Option 2 skips the 375 px test and needs the owner's LAW-08 approval.
- **Owner reply:** 2026-11-11T08:18:13.780Z, message `24922b40-9965-4b5b-bb70-4fd7f0d4217f`, button "Use the guard".
- **Scope:** a viewport-independent guard in `CharacterLifeShell.svelte` only. No layout change, no test changes, and the existing tests keep running.

## 3. "Yes, extend the guard" (after the AGENTS.md §4 anti-loop HOLD)

- **Question shown:** 2026-11-11T08:25:35Z, "Extend the guard to the repeated mousedown and continue PR B?"
- **Buttons:** "Yes, extend the guard" / "Stop and review"
- **Recap shown:** "PR B is on anti-loop HOLD after 2 fix attempts on the 375 px double-click. The guard blocks the stray click, but the repeated mousedown still moves focus to Help. A measured diagnostic shows extending the same guard to that mousedown fixes it; it is not applied yet."
- **Claude's message shown with it** (Vietnamese, summarised):
  - a table measured at 375 px: click-only guard gives focus `life-nav-help`; click plus mousedown gives focus `life-reports-heading`;
  - the proposal: extend the same guard to the repeated mousedown, in the same 0.5 s window after End Week, about 2 lines. This mirrors the existing End Week `onmousedown` `preventDefault` used while the game is locked;
  - then run GREEN for the 375 px case, the three Main menu cases, the full navigation spec and `title.spec.ts`, then finish B3 and B4.
- **Owner reply:** 2026-11-11T08:57:36.047Z, message `0bd3c38c-5cb5-4778-9096-47c0df7db6eb`, button "Yes, extend the guard".
- **Scope:** the third fix attempt, limited to adding a capture-phase mousedown `preventDefault` to the same guard, with the same window and condition (`detail > 1`, at most 500 ms after End Week), in `CharacterLifeShell.svelte` only.

## 4. Push and PR

- **Owner reply:** 2026-11-11T11:27:44.099Z, message `4793beb2-aa0b-4d46-b785-9637d48ef515`, button "Push and open PR".
- **Question shown:** "Push feat/ui-title-screen-b and open PR B?"
