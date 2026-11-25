p = 'packages/simulation/src/__tests__/household-week.test.ts'
data, reason = generated[p]
data = data.replace(b'{ paidMilli: 0, unpaidMilli: 3000 });', b'{ paidMilli: 1000, unpaidMilli: 2000 });')
data = data.replace(b'  society.tension = 80;\n  stock(s).food = 0;', b'''  society.tension = 80;
  for (const key of ['free', 'makers', 'luminaries', 'merchants', 'bound'] as const) society.satisfaction[key] = 10;
  s.city.happiness = 10;
  stock(s).food = 0;''')
generated[p] = (data, reason)
p = 'scripts/p7b-road-balance.ts'
data, reason = generated[p]
generated[p] = (data.replace(b"build('plain-2', 'workshop', 1);", b"build('ore-1', 'mine', 1);"), reason)

p = 'packages/core/src/world/__tests__/npc-generator.test.ts'
edit(p, """    [['P7B_TRIAL', 'npcCap'], 0, 'P7B_TRIAL.npcCap: expected integer > 0'],""", """    [['P7B_TRIAL', 'npcCap'], 0, 'P7B_TRIAL.npcCap: expected integer > 0'],
    [['P7B_TRIAL', 'household', 'unpaidAffectionLoss'], -1, 'P7B_TRIAL.household.unpaidAffectionLoss: expected integer in [0, 100]'],
    [['P7B_TRIAL', 'household', 'stressRefusalHits'], 0, 'P7B_TRIAL.household.stressRefusalHits: expected integer > 0'],
    [['P7B_TRIAL', 'household', 'renewalWageMultiplier'], 0.75, 'P7B_TRIAL.household.renewalWageMultiplier: expected finite number >= 1'],""", 'RED exact Decision 13 catalog diagnostics')

