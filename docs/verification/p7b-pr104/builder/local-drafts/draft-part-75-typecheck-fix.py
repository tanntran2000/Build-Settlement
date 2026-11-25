path = ui+'report-letters.ts'
edit(path,'export function householdReportRows(report: Readonly<TileTrialReport>) {',
    "export function householdReportRows(report: Readonly<Pick<TileTrialReport, 'household'>>) {",
    'Read only the optional field and keep the report row test typed without a partial-report cast.')
path = ui+'__tests__/acquisition-view.test.ts'
amend_generated(path, ' } } as TileTrialReport;', " } } satisfies Pick<TileTrialReport, 'household'>;")
amend_generated(path, 'householdReportRows({} as TileTrialReport)', 'householdReportRows({})')
amend_generated('tests/e2e/acquisition.spec.ts',"await selectArea(page, 'work');","await selectArea(page, 'Work');")
