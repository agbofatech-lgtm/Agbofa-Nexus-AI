#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Read-only verifier: this script must not install, upgrade, download, or modify tools.
$checks = @(
    @{ Name = 'Go';          Command = 'go';           Args = @('version');    Expected = '1.22.12';    Pattern = 'go1\.22\.12(?:\s|$)' },
    @{ Name = 'Buf';         Command = 'buf';          Args = @('--version');  Expected = '1.32.2';     Pattern = '(?<![0-9])1\.32\.2(?![0-9])' },
    @{ Name = 'protoc';      Command = 'protoc';       Args = @('--version');  Expected = '25.3';       Pattern = '(?<![0-9])25\.3(?![0-9])' },
    @{ Name = 'Gitleaks';    Command = 'gitleaks';     Args = @('version');    Expected = '8.18.4';     Pattern = '(?<![0-9])8\.18\.4(?![0-9])' },
    @{ Name = 'Docker';      Command = 'docker';       Args = @('--version');  Expected = '29.6.1';     Pattern = '(?<![0-9])29\.6\.1(?![0-9])' },
    @{ Name = 'PostgreSQL';  Command = 'postgres';     Args = @('--version');  Expected = '16.14';      Pattern = '(?<![0-9])16\.14(?![0-9])' },
    @{ Name = 'Playwright';  Command = 'playwright';   Args = @('--version');  Expected = '1.62.1';     Pattern = '(?<![0-9])1\.62\.1(?![0-9])' },
    @{ Name = 'govulncheck'; Command = 'govulncheck';  Args = @('-version');   Expected = '1.7.0';      Pattern = '(?<![0-9])1\.7\.0(?![0-9])' },
    @{ Name = 'gosec';       Command = 'gosec';        Args = @('-version');   Expected = '2.21.1-dev'; Pattern = '2\.21\.1-dev'; DevelopmentBuild = $true },
    @{ Name = 'Node.js';     Command = 'node';         Args = @('--version');  Expected = '22.22.3';    Pattern = '^v22\.22\.3(?:\s|$)' },
    @{ Name = 'pnpm';        Command = 'pnpm';         Args = @('--version');  Expected = '11.22.0';    Pattern = '^11\.22\.0(?:\s|$)' },
    @{ Name = 'TypeScript';  Command = 'tsc';          Args = @('--version');  Expected = '5.9.3';      Pattern = '(?<![0-9])5\.9\.3(?![0-9])' },
    @{ Name = 'Git';         Command = 'git';          Args = @('--version');  Expected = '2.55.0';     Pattern = '(?<![0-9])2\.55\.0(?![0-9])' }
)

$results = foreach ($check in $checks) {
    $command = Get-Command $check.Command -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $command) {
        [pscustomobject]@{
            Name             = $check.Name
            ExpectedVersion  = $check.Expected
            Found            = $false
            ExactVersion     = $false
            ExecutablePath   = $null
            VersionOutput    = $null
            ExitCode         = $null
            SHA256           = $null
            DevelopmentBuild = [bool]($check.DevelopmentBuild)
            Provenance       = if ($check.DevelopmentBuild) { 'UNVERIFIED' } else { 'PENDING' }
        }
        continue
    }

    $output = (& $command.Source @($check.Args) 2>&1 | Out-String).Trim()
    $exitCode = $LASTEXITCODE
    $hash = $null
    try {
        if (Test-Path -LiteralPath $command.Source -PathType Leaf) {
            $hash = (Get-FileHash -LiteralPath $command.Source -Algorithm SHA256).Hash.ToLowerInvariant()
        }
    } catch {
        $hash = $null
    }

    [pscustomobject]@{
        Name             = $check.Name
        ExpectedVersion  = $check.Expected
        Found            = $true
        ExactVersion     = ($exitCode -eq 0 -and $output -match $check.Pattern)
        ExecutablePath   = $command.Source
        VersionOutput    = $output
        ExitCode         = $exitCode
        SHA256           = $hash
        DevelopmentBuild = [bool]($check.DevelopmentBuild)
        Provenance       = if ($check.DevelopmentBuild) { 'UNVERIFIED' } else { 'PENDING' }
    }
}

if ($Json) {
    $results | ConvertTo-Json -Depth 4
} else {
    $results | Format-Table Name, ExpectedVersion, Found, ExactVersion, ExecutablePath, DevelopmentBuild, Provenance -AutoSize
}

if ($results.Where({ -not $_.ExactVersion }).Count -gt 0) {
    exit 1
}

exit 0
