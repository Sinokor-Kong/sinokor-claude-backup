param([string]$List, [string]$OutDir)
New-Item -ItemType Directory -Force $OutDir | Out-Null
$ol = New-Object -ComObject Outlook.Application
$ns = $ol.GetNamespace("MAPI")
$stores = @($ns.Stores | ForEach-Object { $_.StoreID })
$items = Get-Content $List -Raw -Encoding UTF8 | ConvertFrom-Json
$ok = 0
foreach ($x in $items) {
  $m = $null
  try { $m = $ns.GetItemFromID($x.entry) } catch {}
  if (-not $m) { foreach ($sid in $stores) { try { $m = $ns.GetItemFromID($x.entry, $sid); break } catch {} } }
  if (-not $m) { Write-Output "NOT FOUND $($x.file)"; continue }
  $done = $false
  foreach ($a in $m.Attachments) { if ("$($a.FileName)" -eq $x.file) { $a.SaveAsFile((Join-Path $OutDir $x.target)); $done = $true; break } }
  if ($done) { $ok++ } else { Write-Output "NO ATTACH $($x.file)" }
}
Write-Output "saved $ok of $($items.Count)"
