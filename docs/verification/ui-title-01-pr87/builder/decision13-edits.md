tests/e2e/character-life.spec.ts:24: name: 'Character Life' → name: 'HAVEN'
tests/e2e/character-life.spec.ts:26: button(page, 'Continue locally') → button(page, 'Continue')
tests/e2e/character-life.spec.ts:28: .toBeVisible(); → .toHaveCount(0);
tests/e2e/character-life.spec.ts:100: name: 'Character Life' → name: 'HAVEN'
tests/e2e/character-life.spec.ts:166: await button(page, 'Continue locally').click(); → await expect(button(page, 'Continue')).toBeDisabled();
tests/e2e/character-life.spec.ts:167: page.getByRole('alert') → page.getByText('No local checkpoint', { exact: true })
tests/e2e/character-life.spec.ts:167: 'No local checkpoint in this browser yet. Choose Save locally first.' → 'No local checkpoint'
tests/e2e/character-life.spec.ts:267: button(page, 'Continue locally') → button(page, 'Continue')
tests/e2e/crime.spec.ts:25: await button(page,'Continue locally').click(); → await expect(button(page,'Continue')).toBeDisabled();
tests/e2e/crime.spec.ts:25: page.getByRole('alert')).toHaveText('No local checkpoint in this browser yet. Choose Save locally first.') → page.getByText('No local checkpoint',{exact:true})).toHaveText('No local checkpoint')
tests/e2e/crisis.spec.ts:24: await button(page,'Continue locally').click(); → await expect(button(page,'Continue')).toBeDisabled();
tests/e2e/crisis.spec.ts:24: page.getByRole('alert')).toHaveText('No local checkpoint in this browser yet. Choose Save locally first.') → page.getByText('No local checkpoint',{exact:true})).toHaveText('No local checkpoint')
tests/e2e/society.spec.ts:38: await button(page,'Continue locally').click(); → await expect(button(page,'Continue')).toBeDisabled();
tests/e2e/society.spec.ts:38: page.getByRole('alert')).toContainText('No local checkpoint') → page.getByText('No local checkpoint',{exact:true})).toContainText('No local checkpoint')
tests/e2e/society.spec.ts:38: await button(page,'Continue locally').click(); → await button(page,'Continue').click();
tests/e2e/order.spec.ts:27: button(page,'Continue locally') → button(page,'Continue')
tests/e2e/outside.spec.ts:18: button(page,'Continue locally') → button(page,'Continue')
tests/e2e/world-npc-session.spec.ts:29: name:'Continue locally' → name:'Continue'
tests/e2e/character-life-navigation.spec.ts:1364: name: 'Continue locally' → name: 'Continue'
tests/e2e/tile-local-checkpoint.spec.ts:9: name:'Continue locally' → name:await page.getByTestId('life-shell').count()?'Continue locally':'Continue'
tests/e2e/tile-local-checkpoint.spec.ts:45: .toEqual([]); → .toEqual([['get',KEY]]);
tests/e2e/tile-local-checkpoint.spec.ts:45: .toEqual([['get',KEY],['set',KEY]]); → .toEqual([['get',KEY],['get',KEY],['set',KEY]]);
tests/e2e/error-log.spec.ts:208: await expect(panel(page)) → await page.getByRole('button',{name:'Options',exact:true}).click();await expect(panel(page))
