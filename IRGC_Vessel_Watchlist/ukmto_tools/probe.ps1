param([string]$Out)
$ol = New-Object -ComObject Outlook.Application
$ns = $ol.GetNamespace("MAPI")
$filter = "@SQL=(""urn:schemas:httpmail:subject"" LIKE '%UKMTO%' OR ""urn:schemas:httpmail:fromemail"" LIKE '%ukmto%' OR ""urn:schemas:httpmail:fromname"" LIKE '%UKMTO%') AND ""urn:schemas:httpmail:hasattachment"" = 1"
$rows = New-Object System.Collections.Generic.List[object]
function Walk($f) {
  try { $items = $f.Items.Restrict($filter) } catch { $items = @() }
  foreach ($m in $items) {
    try {
      if ($m.Class -ne 43) { continue }
      foreach ($a in $m.Attachments) {
        if ("$($a.FileName)" -match '\.pdf$') {
          $rows.Add([pscustomobject]@{ folder=$f.FolderPath; recv=$m.ReceivedTime.ToString("yyyy-MM-dd HH:mm"); from="$($m.SenderEmailAddress)"; subj="$($m.Subject)"; file="$($a.FileName)"; size=$a.Size; entry=$m.EntryID })
        }
      }
    } catch {}
  }
  foreach ($c in $f.Folders) { Walk $c }
}
foreach ($st in $ns.Stores) { try { Walk $st.GetRootFolder() } catch {} }
$rows | ConvertTo-Json -Depth 3 | Out-File -Encoding utf8 $Out
Write-Output "pdf attachments: $($rows.Count)"
