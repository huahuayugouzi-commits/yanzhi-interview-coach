$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:TEMP = Join-Path $PSScriptRoot 'work\tmp'
$env:TMP = $env:TEMP
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $PSScriptRoot '.browsers'
New-Item -ItemType Directory -Path $env:TEMP -Force | Out-Null
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) { $nodeExe = $nodeCommand.Source } else {
  $nodeExe = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $nodeExe)) { throw 'Please install Node.js 22.12+ and retry.' }
if (-not (Test-Path -LiteralPath 'dist\index.html')) { throw 'Build first: pnpm run build' }
& $nodeExe '--env-file-if-exists=.env' 'server/index.mjs'
