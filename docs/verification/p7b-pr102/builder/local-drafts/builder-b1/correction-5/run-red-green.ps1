param([ValidateSet('red','green')][string]$Phase, [string]$Evidence)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$env:CI='1'
$env:NO_COLOR=$null
$env:FORCE_COLOR='0'
$head=(git rev-parse HEAD).Trim()
$tree=(git rev-parse 'HEAD^{tree}').Trim()
function Invoke-Case([string]$Name,[string]$Command,[int]$ExpectedExit) {
    $log = Join-Path $Evidence ($Phase + '-' + $Name + '.txt')
    @("HEAD $head","Tree $tree","Start UTC $([DateTime]::UtcNow.ToString('o'))","CI=$env:CI","Command: $Command") | Out-File -LiteralPath $log -Encoding utf8
    & cmd.exe /d /s /c ($Command+' 2>&1') | Out-File -LiteralPath $log -Append -Encoding utf8
    $code=$LASTEXITCODE
    @("End UTC $([DateTime]::UtcNow.ToString('o'))","Exit code: $code") | Out-File -LiteralPath $log -Append -Encoding utf8
    Write-Output "$Phase $Name exit $code"
    if ($code -ne $ExpectedExit) { throw "Unexpected exit $code for $Name. See $log" }
    if ($Name -in @('mansion','report') -and -not (Select-String -LiteralPath $log -SimpleMatch 'Running 1 test using 1 worker')) { throw "Expected one isolated test in $log" }
}
$expected = if ($Phase -eq 'red') { 1 } else { 0 }
Invoke-Case 'build' 'npm run build --workspace=@haven/ui' 0
Invoke-Case 'mansion' ('npm run test:smoke -- tests/e2e/society.spec.ts:51 --grep "opens Ring 4 and uses the fixed estate controls at 1280px$" --output "'+(Join-Path $Evidence ($Phase+'-mansion-artifacts'))+'"') $expected
Invoke-Case 'report' ('npm run test:smoke -- tests/e2e/character-life-navigation.spec.ts:1106 --grep "report matches complete executor projection: zero$" --output "'+(Join-Path $Evidence ($Phase+'-report-artifacts'))+'"') $expected
