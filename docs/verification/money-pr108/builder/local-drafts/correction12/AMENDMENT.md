# Money M3 · Correction 12 amendment

Base commit `0b2b3a6088d003301d48b460202327fb53546ede`, tree `75ec12d1a9c537f5e9788ac0ec52d3ff68db620c`. This amendment layers the two approved changes over the sealed Step 0 bytes. The original packet remains verifiable in the parent folder.

Owner, verbatim. Robbery values “Duyệt bộ số (Recommended)”, Easy amount “Easy an toàn gấp đôi”, reserve “Khóa phần bị đe dọa (Recommended)”, remaining items “Duyệt tất cả (Recommended)”. Binding plan `4dcf71f`, SHA-256 `e2f50a03f12c3968d1e239016abe1b775c262e830cd3281ca8eed26510a32865`.

## Exact decisions and bytes

- Add `robberySafeBps` to the existing frozen profiles, 10000 Normal and 20000 Easy. Normal validates with “must be 10000”, Easy with “expected integer in [1, 100000]”. The existing safe-overflow message now checks the largest applicable safe scalar. At Security 30, the UI shows 22.5 Money or 45 Money. At closing Security 25 the line is 21.25 Money or 42.5 Money.
- Reserve the exact saved excess while the card exists. Ordinary donations, item/potion buys, and crafting use the same debit predicate. A refund or sale credits Money through the existing credit path. Each resolution uses the same original excess as its quote. Pay is 25%, failed Chase and Let go 60%, successful Chase 0, floored to whole milli. Resolving clears the card and reserve. Existing acceptance of v14 saved cards stays in the reader.
- Donation, Market, potion Buy and workshop/Brew controls use the exact sentence “4 Money is held until the robbery is answered.” when the held amount is 4. The amount uses the ordinary Money formatter, for example “4.001 Money is held until the robbery is answered.”. The affected controls carry the reason in their accessible description. Existing no-reserve purchase flows are preserved. Pricing, costs, and availability still use their existing validation.
- The Correction 12 display diff enumerates all changes relative to the sealed proposal. The two JSON inventories carry complete file bytes, base hashes, path reasons and stage labels, including the narrow debit-path additions in `item-command.ts` and the City, Market, ItemCard, Potion and Workshop components. Existing tests outside those approved paths retain their bytes.

## Updated RED list

- M3.1 adds the new field to the exact profile check, rejects out-of-range or fractional Easy fields and nonidentity Normal, and rejects safe overflow that only occurs after Easy scaling. Seed 40 Easy, 5% levy: 39,646 + 2,854 closes exactly at 42,500 without a card, with a matched 42,499 control. Opening 50,001 at 5% closes at 52,855 with snapshot 10,355, Pay 2,588, failed Chase and Let go 6,213. Determinism and both-card checkpoint cases remain.
- M3.1 exercises all four debit routes. For a 4,000 reserve, an opening balance of 3,999 plus the action cost fails the full envelope and state check. One more milli pays the debit and leaves 4,000 exactly. The loss stays 2,400 after spending, and a 1,000 fee refund takes the remaining purse from 4,000 to 5,000 without changing that loss. The original donation edge now expects exact loss 2,400 even after a permitted donation.
- M3.2 keeps both existing desktop sequences, updates Easy to “Safe amount 45 Money · At risk 5.001 Money” before End Week, and expects 50.267 Money after Pay. At each width an imported 4,999 balance with a 4,000 reserve checks the disabled reason and keyboard refusal on donation, market offers, all three potion purchases and a craft fee, with whole exported state equality. Unit preview tests pin the same reason and quote after changing the unreserved balance.
- Measurement repeats the frozen Normal and Easy routes at their approved thresholds. Record the realized hits and counts without adjusting any tuning value.

Scratch checks run separately from source branch RED and GREEN checks. Full command output, exit codes and UTC times are in this directory.


Initial scratch TypeScript and ESLint exited 0. Vitest with two workers exited 0 with 3,415 tests. The exact-byte recheck after EOF normalization repeated TypeScript and ESLint with exit 0. One unchanged case reached its existing 5-second limit on the first exact Vitest run. The single-worker retry passed all 3,415 tests in 154 files.
