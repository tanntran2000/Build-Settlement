# Correction 18 smoke HOLD

The exact-head Chromium smoke finished with 409 passed and six failed. Each failure reached the serialization assertion in `importLife` before the first layout check.

| Case | Widths | Fixture change before serialization |
| --- | --- | --- |
| Long character and report content reflows | 1600, 1280, 375, 320 px | The fixture renames a current-week recruit to 64 M characters. |
| NPC sheet and NPC life report reflow | 320, 375 px | The fixture renames a current-week recruit to 64 W characters. |

The shared test helper now records retained Guild offers as bought for injected current-week residents. The two reflow fixtures change the displayed character name after that setup. Serialization checks the resident against the seeded name on the backing offer and refuses the mismatch. The observed failures occur in fixture setup, before reflow is measured.

The next candidate needs a separately approved fixture repair that preserves the long-name cases and all layout assertions while giving the renamed test residents a valid checkpoint provenance. The existing replay checks apply to actual current-week acquisitions.

[Full run](gate-8-smoke.txt) · [Original failure stacks](smoke-full-failures/trace-errors.json) · [Isolated results](smoke-isolated-reruns/results.json)
