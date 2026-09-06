# What changed, and why

<!-- A sentence or two. Link the issue if there is one. -->

## Tests

<!--
Tests move with the code. Tick what applies, or say plainly that no test was
warranted and why. See .github/copilot-instructions.md for which tier a change
belongs in.
-->

- [ ] Unit or contract tests added/updated (`test/unit/`)
- [ ] Build-output assertions added/updated (`test/build/`)
- [ ] Browser tests added/updated (`test/e2e/`)
- [ ] New route added to `expectedRoutes` and `test/e2e/routes.ts`
- [ ] No test warranted — because: <!-- e.g. prose edit inside an existing article -->

If this fixes a bug, the failing test was written first, in the cheapest tier
that could catch it.

## Checks

- [ ] `npm run verify` passes
- [ ] `npm run test:e2e` passes (if UI, navigation or the form changed)

## Advocate review

- [ ] No legal, compliance or professional-conduct copy changed
- [ ] Copy changed and is marked with `⚖️` for the advocate to review
