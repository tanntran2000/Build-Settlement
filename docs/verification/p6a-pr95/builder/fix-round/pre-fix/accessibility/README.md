# Final new-panel accessibility evidence

HEAD 8af03070496d8e41ae85fecaea2d29c4cc474811; tree 025cbcb04ad3f3722d0bbd4a1ae1165e4915bfc4. All 14 measurements passed during the final CI=1 smoke. The smoke log records each case.

Run the tracked script from the repository: npx playwright test tests/e2e/items.spec.ts -g accessibility. The adjacent items.spec.ts is an exact source copy for review; its imports resolve in the repository, not this evidence folder.

Measurements cover rendered text contrast, viewport clipping/overflow, target dimensions and keyboard traversal. No timeout was added. Historical whole-report RED measurements are preserved separately in red-accessibility; the final audits target the new item Details regions.
