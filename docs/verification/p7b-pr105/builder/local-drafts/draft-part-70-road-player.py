p = 'scripts/p7b-road-balance.ts'
data, reason = generated[p]
generated[p] = (data.replace(b'createCharacterLifeSession(seed, structuredClone(DEFAULT_PLAYER_DRAFT))',
    b"createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Road Keeper' })"), reason)

