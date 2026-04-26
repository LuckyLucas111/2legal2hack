[CmdletBinding()]
param(
  [switch]$Run,
  [switch]$NoRun,
  [switch]$Seed,
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$VenvDir = Join-Path $BackendDir ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$BackendDataDir = Join-Path $BackendDir "data"
$BackendUploadDir = Join-Path $BackendDir "app\uploads"
$EnvFile = Join-Path $BackendDir ".env"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Resolve-Tool {
  param(
    [string[]]$Names,
    [string]$FriendlyName
  )

  foreach ($name in $Names) {
    $command = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $command) {
      return $command.Source
    }
  }

  throw "$FriendlyName was not found. Install it, reopen PowerShell, then run install-windows.cmd again."
}

function ConvertTo-VersionNumber {
  param([string]$Text)

  $match = [regex]::Match($Text, "\d+(\.\d+){1,3}")
  if (-not $match.Success) {
    throw "Could not parse version from: $Text"
  }

  return [version]$match.Value
}

function Get-ExternalVersion {
  param(
    [string]$Path,
    [string[]]$Arguments
  )

  $output = (& $Path @Arguments 2>&1 | Out-String).Trim()
  return @{
    Text = $output
    Version = ConvertTo-VersionNumber $output
  }
}

function Assert-MinVersion {
  param(
    [string]$Name,
    [string]$Path,
    [string[]]$Arguments,
    [version]$Minimum
  )

  $versionInfo = Get-ExternalVersion -Path $Path -Arguments $Arguments
  if ($versionInfo.Version -lt $Minimum) {
    throw "$Name $Minimum or newer is required. Found $($versionInfo.Text)."
  }

  Write-Host "${Name}: $($versionInfo.Text)"
}

function Invoke-External {
  param(
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$WorkingDirectory
  )

  Push-Location $WorkingDirectory
  try {
    Write-Host "> $FilePath $($Arguments -join ' ')" -ForegroundColor DarkGray
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code $LASTEXITCODE."
    }
  }
  finally {
    Pop-Location
  }
}

function Write-Utf8NoBom {
  param(
    [string]$Path,
    [string[]]$Lines
  )

  $encoding = New-Object System.Text.UTF8Encoding -ArgumentList $false
  $text = ($Lines -join [Environment]::NewLine) + [Environment]::NewLine
  [System.IO.File]::WriteAllText($Path, $text, $encoding)
}

function Get-EnvValue {
  param(
    [string]$Path,
    [string]$Name
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  $pattern = "^\s*" + [regex]::Escape($Name) + "\s*=\s*(.*)\s*$"
  foreach ($line in Get-Content -LiteralPath $Path) {
    $match = [regex]::Match($line, $pattern)
    if ($match.Success) {
      return $match.Groups[1].Value.Trim().Trim('"').Trim("'")
    }
  }

  return $null
}

function Set-EnvValue {
  param(
    [string]$Path,
    [string]$Name,
    [string]$Value
  )

  $lines = @()
  if (Test-Path -LiteralPath $Path) {
    $lines = @(Get-Content -LiteralPath $Path)
  }

  $pattern = "^\s*" + [regex]::Escape($Name) + "\s*="
  $updated = $false
  $newLines = foreach ($line in $lines) {
    if ($line -match $pattern) {
      $updated = $true
      "$Name=$Value"
    }
    else {
      $line
    }
  }

  if (-not $updated) {
    $newLines += "$Name=$Value"
  }

  Write-Utf8NoBom -Path $Path -Lines $newLines
}

function ConvertFrom-SecureStringValue {
  param([securestring]$Value)

  if ($null -eq $Value) {
    return ""
  }

  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Ensure-EnvFile {
  if (-not (Test-Path -LiteralPath $EnvFile)) {
    Write-Step "Creating backend .env"
    $secureKey = Read-Host "OpenAI API key (input hidden, press Enter to skip)" -AsSecureString
    $apiKey = ConvertFrom-SecureStringValue $secureKey
    Write-Utf8NoBom -Path $EnvFile -Lines @(
      "OPENAI_API_KEY=$apiKey",
      "DATABASE_URL=sqlite+aiosqlite:///./data/app.db",
      "CHROMA_PERSIST_DIR=./data/chroma",
      "UPLOAD_DIR=./app/uploads"
    )
  }
  elseif ([string]::IsNullOrWhiteSpace((Get-EnvValue -Path $EnvFile -Name "OPENAI_API_KEY"))) {
    Write-Warning "backend\.env exists, but OPENAI_API_KEY is empty."
    $secureKey = Read-Host "OpenAI API key (input hidden, press Enter to leave empty)" -AsSecureString
    $apiKey = ConvertFrom-SecureStringValue $secureKey
    if (-not [string]::IsNullOrWhiteSpace($apiKey)) {
      Set-EnvValue -Path $EnvFile -Name "OPENAI_API_KEY" -Value $apiKey
    }
  }

  if ([string]::IsNullOrWhiteSpace((Get-EnvValue -Path $EnvFile -Name "OPENAI_API_KEY"))) {
    Write-Warning "AI features need OPENAI_API_KEY. You can add it later in backend\.env."
  }
}

function New-PowerShellLiteral {
  param([string]$Value)
  return "'" + ($Value -replace "'", "''") + "'"
}

function Wait-ForHttp {
  param(
    [string]$Url,
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 2 | Out-Null
      return $true
    }
    catch {
      Start-Sleep -Seconds 1
    }
  }

  return $false
}

function Start-App {
  param([string]$NpmPath)

  Write-Step "Starting backend and frontend"

  $backendCommand = "Set-Location -LiteralPath $(New-PowerShellLiteral $BackendDir); & $(New-PowerShellLiteral $VenvPython) -m uvicorn app.main:app --reload"
  $frontendCommand = "Set-Location -LiteralPath $(New-PowerShellLiteral $FrontendDir); & $(New-PowerShellLiteral $NpmPath) run dev"

  Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand) | Out-Null
  Start-Sleep -Seconds 2
  Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand) | Out-Null

  if ($Seed) {
    Write-Step "Seeding demo data"
    if (Wait-ForHttp -Url "http://localhost:8000/api/v1/health" -TimeoutSeconds 45) {
      Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/seed" | Out-Null
      Write-Host "Demo data seeded."
    }
    else {
      Write-Warning "Backend did not become ready in time; skipping demo data seed."
    }
  }

  Start-Process "http://localhost:5173" | Out-Null
  Write-Host "Frontend: http://localhost:5173"
  Write-Host "Backend:  http://localhost:8000"
}

try {
  Write-Host "2legal2hack Windows setup" -ForegroundColor Green
  Write-Host "Project: $RootDir"

  if (-not (Test-Path -LiteralPath $BackendDir)) {
    throw "Backend directory not found: $BackendDir"
  }
  if (-not (Test-Path -LiteralPath $FrontendDir)) {
    throw "Frontend directory not found: $FrontendDir"
  }

  Write-Step "Checking prerequisites"
  $pythonPath = Resolve-Tool -Names @("python.exe", "python") -FriendlyName "Python"
  $nodePath = Resolve-Tool -Names @("node.exe", "node") -FriendlyName "Node.js"
  $npmPath = Resolve-Tool -Names @("npm.cmd", "npm") -FriendlyName "npm"

  Assert-MinVersion -Name "Python" -Path $pythonPath -Arguments @("--version") -Minimum ([version]"3.11")
  Assert-MinVersion -Name "Node.js" -Path $nodePath -Arguments @("--version") -Minimum ([version]"18.0")
  Assert-MinVersion -Name "npm" -Path $npmPath -Arguments @("--version") -Minimum ([version]"8.0")

  if ($CheckOnly) {
    Write-Step "Check only"
    Write-Host "Backend venv:  $(if (Test-Path -LiteralPath $VenvPython) { 'present' } else { 'missing' })"
    Write-Host "Frontend deps: $(if (Test-Path -LiteralPath (Join-Path $FrontendDir 'node_modules')) { 'present' } else { 'missing' })"
    Write-Host ".env file:     $(if (Test-Path -LiteralPath $EnvFile) { 'present' } else { 'missing' })"
    exit 0
  }

  Ensure-EnvFile

  Write-Step "Preparing local folders"
  New-Item -ItemType Directory -Force -Path $BackendDataDir | Out-Null
  New-Item -ItemType Directory -Force -Path $BackendUploadDir | Out-Null

  Write-Step "Installing backend dependencies"
  if (-not (Test-Path -LiteralPath $VenvPython)) {
    Invoke-External -FilePath $pythonPath -Arguments @("-m", "venv", $VenvDir) -WorkingDirectory $BackendDir
  }
  Invoke-External -FilePath $VenvPython -Arguments @("-m", "pip", "install", "--upgrade", "pip") -WorkingDirectory $BackendDir
  Invoke-External -FilePath $VenvPython -Arguments @("-m", "pip", "install", "-e", ".") -WorkingDirectory $BackendDir

  Write-Step "Installing frontend dependencies"
  Invoke-External -FilePath $npmPath -Arguments @("install") -WorkingDirectory $FrontendDir

  Write-Step "Setup complete"

  $shouldRun = $Run
  if (-not $NoRun -and -not $Run) {
    $answer = Read-Host "App jetzt starten? [J/n]"
    $shouldRun = [string]::IsNullOrWhiteSpace($answer) -or $answer -match "^[jJyY]"
  }

  if ($shouldRun -and -not $NoRun) {
    Start-App -NpmPath $npmPath
  }
  else {
    Write-Host "Start later with:"
    Write-Host "  .\install-windows.cmd -Run"
  }
}
catch {
  Write-Host ""
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
