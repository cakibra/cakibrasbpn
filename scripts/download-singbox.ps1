$ErrorActionPreference = "Stop"

$Version = "1.13.8"
$Arch = "amd64"
$ZipName = "sing-box-$Version-windows-$Arch.zip"
$Url = "https://github.com/SagerNet/sing-box/releases/download/v$Version/$ZipName"

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot
$TargetDir = Join-Path $ProjectRoot "src-tauri\resources\bin"
$ZipPath = Join-Path $env:TEMP $ZipName

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

$ExistingExe = Join-Path $TargetDir "sing-box.exe"
if (Test-Path $ExistingExe) {
    Write-Host "sing-box.exe already exists at $ExistingExe"
    exit 0
}

Write-Host "Downloading $Url"
Invoke-WebRequest -Uri $Url -OutFile $ZipPath

Write-Host "Extracting archive..."
$ExtractDir = Join-Path $env:TEMP ("sing-box-extract-" + [guid]::NewGuid().ToString("N"))
Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force

$Exe = Get-ChildItem -Path $ExtractDir -Recurse -Filter "sing-box.exe" | Select-Object -First 1
if (-not $Exe) {
    throw "sing-box.exe not found inside archive."
}

Copy-Item $Exe.FullName $ExistingExe -Force
Write-Host "Saved sidecar to $ExistingExe"
