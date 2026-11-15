# P59 — owner-approved timeout only

Owner Tân, 2026-11-15, dialog choice, verbatim: "Set this test to 15 s (Recommended)". Binding plan: binding-plan-00af2a9.md, Plan correction 2.

File: packages/simulation/src/__tests__/lord-health.test.ts:73; changed closing line 84. Base: 2a92985e20c5eb0eb0a9faa053bcd73f64410286.

Before:

```ts
it('a Calm game below Crime 70 survives all 60 weeks from health one', () => {
  let s = life(); s.player.character.health = 1;
  const stocks = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  for (const key of ['gold','food','wood','iron'] as const) stocks[key] = 1_000_000;
  s.city.goodsStock!.amountMilli = 1_000_000;
  for (let week = 1; week <= 60; week++) {
    const r = command(s,'END_WEEK',{expectedWeek:week}); s = r.next;
    expect(s.city.society!.order.crime).toBeLessThan(70); expect(s.city.society!.crisis.stage).toBe('none');
    expect(r.report!.crimeEvent!.lordHealthLoss).toBe(0); expect(s.player.character.health).toBe(week+1);
    s = command(s,'NEXT_WEEK').next;
  }
});
```

After:

```ts
it('a Calm game below Crime 70 survives all 60 weeks from health one', () => {
  let s = life(); s.player.character.health = 1;
  const stocks = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  for (const key of ['gold','food','wood','iron'] as const) stocks[key] = 1_000_000;
  s.city.goodsStock!.amountMilli = 1_000_000;
  for (let week = 1; week <= 60; week++) {
    const r = command(s,'END_WEEK',{expectedWeek:week}); s = r.next;
    expect(s.city.society!.order.crime).toBeLessThan(70); expect(s.city.society!.crisis.stage).toBe('none');
    expect(r.report!.crimeEvent!.lordHealthLoss).toBe(0); expect(s.player.character.health).toBe(week+1);
    s = command(s,'NEXT_WEEK').next;
  }
}, 15000);
```

No other byte in the file changes relative to the base. P1–P58 source inventory files remain byte-identical; their SHA-256 values are in p59-edit.json.
