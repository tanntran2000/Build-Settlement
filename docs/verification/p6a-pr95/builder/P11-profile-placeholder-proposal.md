# Pending P11 — Inventory portrait expectation

Proposal only. Nothing in this file is applied to the product branch or counted among the approved P1–P10 edits.

Existing test: `tests/e2e/character-life-navigation.spec.ts:381` (same line at base and current head).

The Step 0 audit missed the loop at lines 379–383: it checks that the static full-body fallback remains visible in **every** profile area, including Inventory. The approved PR C product design hides that fallback in Inventory, where the new Equipment view supplies the flat silhouette. This causes the existing 375px and 1280px placeholder tests to fail. Their initial Description checks still pass.

Plan correction 8 permits exactly P1–P10 and nothing else in the three e2e files. This additional block needs an explicit owner decision. It preserves all Description, Work, Relations, disclosure, identical-markup and bounds assertions, and adds exact Inventory absence plus Equipment visibility.

Before — exact block at line 381:

```ts
        await expect(placeholder).toBeVisible();
        expect(await placeholder.evaluate(el => el.outerHTML)).toBe(staticMarkup);
```

After — proposed exact replacement:

```ts
        if (area === 'Inventory') {
          await expect(placeholder).toHaveCount(0);
          await expect(win.getByRole('region', { name: 'Equipment', exact: true })).toBeVisible();
        } else {
          await expect(placeholder).toBeVisible();
          expect(await placeholder.evaluate(el => el.outerHTML)).toBe(staticMarkup);
        }
```

All setup, the area list, bounds checks after the loop and all other test text stay unchanged. No timeout or threshold change is proposed. If approved, the whole-PR inventory becomes **11 blocks in the same 3 files**, with P1–P10 unchanged.

Alternative owner choice: restore the old full-body fallback in Inventory as well as the new Equipment silhouette, keeping this test unchanged. That preserves the original expectation but displays both portrait placeholders in Inventory. The proposed P11 follows the approved Step 0 Inventory portrait design.
