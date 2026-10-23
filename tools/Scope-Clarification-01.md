# Scope Clarification 01 — prospective post-benchmark completion

Original B remains frozen at `5a928def1e9e3a105b983951b4763b970ee3a173`
(tree `bd0c510c65e8ca9814115fc74066c78c0d7179e4`). This follow-up is a new
child commit, not a retroactive benchmark repair or approval to merge.

TS imports/re-exports and import types remain analyzed throughout eligible `.ts`
and `.d.ts` sources and TS/Svelte script bodies, including generic/type declarations
and both instance/module scripts. Package policy, resolution, containment and cycle
rules remain unchanged. Markup and CSS dependency analysis stays excluded.

Dependency analysis of Svelte script-tag `generics` attributes is deferred. Each
such attribute emits a file/line-located `UNSUPPORTED_SVELTE_GENERICS` error,
making verification `INCOMPLETE` (CLI exit 2). Attribute contents create no edges;
proven body violations remain visible. Comments/text resembling attributes are
not attributes. Malformed source remains an `INCOMPLETE` parse failure.

For S1, if the dependency parser fails before that guard, the existing Svelte
compiler AST locates actual component-script attributes. Its BOM offsets are mapped
back before blanking those ranges and retrying body analysis; no expression is evaluated.

The checker still relies on the lockfile's **transitive** `svelte-eslint-parser`,
not a managed direct dependency. Changes to that dependency graph/API can break
setup or parsing; independent clean-install validation remains necessary. Missing
parsers cause a nonzero module-load/setup failure, not an architecture violation
or PASS. No dependency overhaul, script changes or CI integration is included.
