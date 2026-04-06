$envFile = Join-Path $PSScriptRoot '..\.publish.env.ps1'

if (-not (Test-Path $envFile)) {
  throw "Missing local publish env file: $envFile"
}

. $envFile

if (-not $env:GH_TOKEN) {
  throw 'GH_TOKEN is empty in .publish.env.ps1'
}

$package = Get-Content (Join-Path $PSScriptRoot '..\package.json') -Raw | ConvertFrom-Json
$version = $package.version
$tag = "v$version"
$repo = 'qgming/aiwriter'
$notesFile = Resolve-Path (Join-Path $PSScriptRoot "..\release-notes\$tag.md")

if (-not $notesFile) {
  throw "Missing release notes file for $tag"
}

$headers = @{
  Authorization = "Bearer $($env:GH_TOKEN)"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
}

$releaseNotesText = [System.IO.File]::ReadAllText($notesFile.Path, [System.Text.Encoding]::UTF8)
$releaseApi = "https://api.github.com/repos/$repo/releases/tags/$tag"
$createApi = "https://api.github.com/repos/$repo/releases"

$existingRelease = $null
try {
  $existingRelease = Invoke-RestMethod -Method Get -Uri $releaseApi -Headers $headers
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  if ($statusCode -ne 404) {
    throw
  }
}

if ($existingRelease) {
  $updateApi = "https://api.github.com/repos/$repo/releases/$($existingRelease.id)"
  $payload = @{
    tag_name = $tag
    name = $tag
    body = $releaseNotesText
    draft = $false
    prerelease = $false
  } | ConvertTo-Json -Depth 5 -Compress
  Invoke-RestMethod -Method Patch -Uri $updateApi -Headers $headers -Body $payload -ContentType 'application/json; charset=utf-8' | Out-Null
} else {
  $payload = @{
    tag_name = $tag
    target_commitish = 'main'
    name = $tag
    body = $releaseNotesText
    draft = $false
    prerelease = $false
    generate_release_notes = $false
  } | ConvertTo-Json -Depth 5 -Compress
  Invoke-RestMethod -Method Post -Uri $createApi -Headers $headers -Body $payload -ContentType 'application/json; charset=utf-8' | Out-Null
}

npm run release:github
