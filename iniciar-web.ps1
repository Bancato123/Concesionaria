$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$port = 8080

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Error 'No se encontró Node.js. Instalá Node.js y volvé a ejecutar este archivo.'
    exit 1
}

$env:PORT = "$port"
& $node.Source (Join-Path $root 'servidor.js')
