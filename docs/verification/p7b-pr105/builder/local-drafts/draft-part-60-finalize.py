p = 'tests/e2e/household.spec.ts'
content, reason = generated[p]
generated[p] = (content.replace(b"sheet.locator('dt').getByText(label", b"sheet.getByText(label"), reason)

