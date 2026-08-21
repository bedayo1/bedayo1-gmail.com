<#
  다이아(행로표) xlsx -> pages/다이아 용 HTML/JS 데이터 변환 스크립트.

  ■ 나중에 원본 행로표 파일이 바뀌면 (예: "1호선 행로표(26.05.01.).xlsx" 처럼 갱신판이 나오면)
    이 스크립트만 새 파일로 다시 돌리면 앱 데이터가 자동으로 갱신된다. 다른 코드는 손댈 필요 없음.

    powershell -File scripts\xlsx_to_dia_data.ps1 `
      -XlsxPath "새행로표.xlsx" `
      -OutDir "scripts\_dia_build" `
      -DepotKey "신답승무사업소" `
      -DataJsOut "pages\다이아\data\dia-data-신답승무사업소.js"

    (xlsx 파일이 탐색기 등에서 열려 있으면 잠김 오류가 날 수 있으니 파일을 닫고 실행할 것)

  ■ 새 사업소를 추가하려면?
    1) 그 사업소의 행로표 xlsx로 위 명령을 -DepotKey "새사업소명" -DataJsOut "pages\다이아\data\dia-data-새사업소명.js" 로 실행
    2) pages/다이아/dia.html 에 <script src="./data/dia-data-새사업소명.js"></script> 한 줄 추가
       (다른 코드 변경 불필요 - dia.js 가 window.DIA_DATA 의 키를 자동으로 탭에 반영한다)

  ■ 시트(엑셀 탭) 이름은 반드시 평일/휴일/평평/휴평/평휴/휴휴 중 하나와 정확히 일치해야
    다이아 페이지의 근무구분 탭으로 인식된다.

  ■ 결과물:
    - OutDir 안에 시트별 table_<시트명>.html (디버그/미리보기용)
    - DataJsOut 지정 시 pages/다이아/data/dia-data-<사업소>.js 자동 생성 (직접 수정 금지 - 재생성으로 덮어써짐)

  ■ 변환 시 유지되는 원본 서식:
    - 병합 셀 -> rowspan/colspan
    - 시간/소수 서식 셀 -> 값 변환 (H:MM, 0.0)
    - 셀 테두리(굵기/이중선 등), 배경색, 정렬/세로쓰기, 열너비/행높이 -> 원본 그대로 재현
#>
param(
  [Parameter(Mandatory=$true)][string]$XlsxPath,
  [Parameter(Mandatory=$true)][string]$OutDir,
  [string]$DepotKey = "신답승무사업소",
  [string]$DataJsOut = "",   # 지정하면 pages/다이아/data/dia-data-<사업소>.js 형태로 통합 JS 데이터도 생성
  [int]$RowsPerPage = 45     # 한 페이지에 담을 대략적인 데이터 행 수 (병합된 행 블록은 쪼개지 않음)
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$workDir = Join-Path $OutDir "_unzipped"
if (Test-Path $workDir) { Remove-Item -Recurse -Force $workDir }
New-Item -ItemType Directory -Force -Path $workDir | Out-Null

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Web
[System.IO.Compression.ZipFile]::ExtractToDirectory($XlsxPath, $workDir)

# ---------- sharedStrings ----------
$sstPath = Join-Path $workDir "xl\sharedStrings.xml"
$strings = @()
if (Test-Path $sstPath) {
  [xml]$sst = Get-Content -Raw -Encoding UTF8 $sstPath
  foreach ($si in $sst.sst.si) {
    if ($si.t -is [string]) { $strings += $si.t }
    elseif ($si.t -and $si.t.'#text') { $strings += $si.t.'#text' }
    elseif ($si.t) { $strings += "" }
    else {
      $text = ""
      if ($si.r) { foreach ($r in $si.r) { $text += $r.t } }
      $strings += $text
    }
  }
}

# ---------- styles ----------
[xml]$styles = Get-Content -Raw -Encoding UTF8 (Join-Path $workDir "xl\styles.xml")

$customFmts = @{}
if ($styles.styleSheet.numFmts) {
  foreach ($nf in $styles.styleSheet.numFmts.numFmt) {
    $customFmts[[int]$nf.numFmtId] = $nf.formatCode
  }
}

# ---- borders: index -> @{ left=..; right=..; top=..; bottom=.. } (each a CSS border string or $null)
function Excel-BorderStyleToCss($styleName) {
  switch ($styleName) {
    "thin"             { return "1px solid #333" }
    "medium"           { return "2px solid #222" }
    "thick"            { return "3px solid #111" }
    "double"           { return "3px double #222" }
    "dashed"           { return "1px dashed #444" }
    "dotted"           { return "1px dotted #555" }
    "hair"             { return "1px solid #888" }
    "mediumDashed"     { return "2px dashed #333" }
    "slantDashDot"     { return "1px dashed #333" }
    default            { return $null }
  }
}

$borders = New-Object System.Collections.Generic.List[hashtable]
if ($styles.styleSheet.borders) {
  foreach ($b in $styles.styleSheet.borders.border) {
    $entry = @{
      left   = if ($b.left   -and $b.left.style)   { Excel-BorderStyleToCss $b.left.style }   else { $null }
      right  = if ($b.right  -and $b.right.style)  { Excel-BorderStyleToCss $b.right.style }  else { $null }
      top    = if ($b.top    -and $b.top.style)    { Excel-BorderStyleToCss $b.top.style }    else { $null }
      bottom = if ($b.bottom -and $b.bottom.style) { Excel-BorderStyleToCss $b.bottom.style } else { $null }
    }
    $borders.Add($entry)
  }
}

# ---- fills: index -> CSS color (or $null)
function Argb-ToCss($rgb) {
  if (-not $rgb) { return $null }
  if ($rgb.Length -eq 8) { return "#" + $rgb.Substring(2) }
  return "#$rgb"
}
$fills = New-Object System.Collections.Generic.List[string]
if ($styles.styleSheet.fills) {
  foreach ($f in $styles.styleSheet.fills.fill) {
    $pf = $f.patternFill
    $color = $null
    if ($pf -and $pf.patternType -eq "solid") {
      if ($pf.fgColor) {
        if ($pf.fgColor.rgb) { $color = Argb-ToCss $pf.fgColor.rgb }
        elseif ($pf.fgColor.theme -eq "0") { $color = "#d9d9d9" }
      }
    }
    $fills.Add($color)
  }
}

# ---- cellXfs: index -> style info
$cellXfs = New-Object System.Collections.Generic.List[hashtable]
foreach ($xf in $styles.styleSheet.cellXfs.xf) {
  $nfid = 0
  if ($xf.numFmtId) { [void][int]::TryParse($xf.numFmtId, [ref]$nfid) }
  $borderId = 0
  if ($xf.borderId) { [void][int]::TryParse($xf.borderId, [ref]$borderId) }
  $fillId = 0
  if ($xf.fillId) { [void][int]::TryParse($xf.fillId, [ref]$fillId) }

  $hAlign = $null; $vAlign = $null; $rotation = 0; $wrap = $false
  if ($xf.alignment) {
    if ($xf.alignment.horizontal) { $hAlign = $xf.alignment.horizontal }
    if ($xf.alignment.vertical) { $vAlign = $xf.alignment.vertical }
    if ($xf.alignment.textRotation) { [void][int]::TryParse($xf.alignment.textRotation, [ref]$rotation) }
    if ($xf.alignment.wrapText -eq "1") { $wrap = $true }
  }

  $cellXfs.Add(@{
    numFmtId = $nfid
    borderId = $borderId
    fillId   = $fillId
    hAlign   = $hAlign
    vAlign   = $vAlign
    rotation = $rotation
    wrap     = $wrap
  })
}

function Get-FormatKind($numFmtId) {
  if ($numFmtId -in 18,19,20,21,45,46,47) { return "time" }
  if ($numFmtId -in 14,15,16,17,22) { return "date" }
  if ($customFmts.ContainsKey($numFmtId)) {
    $code = $customFmts[$numFmtId]
    if ($code -match '[hHsS]' -and $code -match ':') { return "time" }
    if ($code -match 'yy|mm.?dd|dd.?mm') { return "date" }
    if ($code -match '^0\.0') { return "decimal1" }
  }
  return "none"
}

function Format-CellValue($rawValue, $kind) {
  if ($rawValue -eq $null -or $rawValue -eq "") { return "" }
  $num = 0.0
  if (-not [double]::TryParse($rawValue, [ref]$num)) { return $rawValue }
  if ($kind -eq "time") {
    $totalMinutes = [int][math]::Round($num * 24 * 60)
    $h = [int][math]::Floor($totalMinutes / 60)
    $m = [int]($totalMinutes % 60)
    return ("{0}:{1:D2}" -f $h, $m)
  }
  if ($kind -eq "decimal1") {
    return ("{0:0.0}" -f $num)
  }
  return $rawValue
}

function ColLettersToNum($letters) {
  $n = 0
  foreach ($ch in $letters.ToCharArray()) { $n = $n * 26 + ([int][char]$ch - [int][char]'A' + 1) }
  return $n
}

function Build-CellStyle($styleIdx) {
  if ($styleIdx -lt 0 -or $styleIdx -ge $cellXfs.Count) { return "" }
  $xf = $cellXfs[$styleIdx]
  $parts = New-Object System.Collections.Generic.List[string]

  if ($xf.borderId -ge 0 -and $xf.borderId -lt $borders.Count) {
    $b = $borders[$xf.borderId]
    if ($b.left)   { $parts.Add("border-left:$($b.left)") }
    if ($b.right)  { $parts.Add("border-right:$($b.right)") }
    if ($b.top)    { $parts.Add("border-top:$($b.top)") }
    if ($b.bottom) { $parts.Add("border-bottom:$($b.bottom)") }
  }
  if ($xf.fillId -ge 0 -and $xf.fillId -lt $fills.Count -and $fills[$xf.fillId]) {
    $parts.Add("background-color:$($fills[$xf.fillId])")
  }
  if ($xf.hAlign) {
    $ta = switch ($xf.hAlign) { "center" {"center"} "right" {"right"} "left" {"left"} default {$null} }
    if ($ta) { $parts.Add("text-align:$ta") }
  }
  if ($xf.vAlign) {
    $va = switch ($xf.vAlign) { "center" {"middle"} "top" {"top"} "bottom" {"bottom"} default {$null} }
    if ($va) { $parts.Add("vertical-align:$va") }
  }
  if ($xf.rotation -and $xf.rotation -gt 0 -and $xf.rotation -le 180) {
    if ($xf.rotation -eq 255) {
      $parts.Add("writing-mode:vertical-rl")
      $parts.Add("text-orientation:upright")
    } else {
      $parts.Add("transform:rotate(-$($xf.rotation)deg)")
      $parts.Add("white-space:nowrap")
    }
  }
  if ($xf.wrap) { $parts.Add("white-space:normal") } else { if ($xf.rotation -eq 0) { $parts.Add("white-space:nowrap") } }

  return ($parts -join ";")
}

# ---------- workbook: sheet name -> file ----------
[xml]$wb = Get-Content -Raw -Encoding UTF8 (Join-Path $workDir "xl\workbook.xml")
[xml]$wbRels = Get-Content -Raw -Encoding UTF8 (Join-Path $workDir "xl\_rels\workbook.xml.rels")

$relTarget = @{}
foreach ($rel in $wbRels.Relationships.Relationship) { $relTarget[$rel.Id] = $rel.Target }

$sheetHtmlByName = [ordered]@{}

foreach ($sheetNode in $wb.workbook.sheets.sheet) {
 try {
  $sheetName = $sheetNode.name
  $rid = $sheetNode.GetAttribute("id", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
  $target = $relTarget[$rid]
  $sheetPath = Join-Path $workDir "xl\$target"

  [xml]$sheet = Get-Content -Raw -Encoding UTF8 $sheetPath

  # merge map
  $mergeAnchorSpan = @{}
  $mergedAway = @{}
  if ($sheet.worksheet.mergeCells) {
    foreach ($mc in $sheet.worksheet.mergeCells.mergeCell) {
      $parts = $mc.ref -split ":"
      if ($parts.Count -eq 2 -and $parts[0] -match '^([A-Z]+)(\d+)$') {
        $c1 = ColLettersToNum $matches[1]; $r1 = [int]$matches[2]
        if ($parts[1] -match '^([A-Z]+)(\d+)$') {
          $c2 = ColLettersToNum $matches[1]; $r2 = [int]$matches[2]
          $mergeAnchorSpan["$c1,$r1"] = @{ rowspan = ($r2 - $r1 + 1); colspan = ($c2 - $c1 + 1) }
          for ($r = $r1; $r -le $r2; $r++) {
            for ($c = $c1; $c -le $c2; $c++) {
              if ($c -ne $c1 -or $r -ne $r1) { $mergedAway["$c,$r"] = $true }
            }
          }
        }
      }
    }
  }

  # column widths (엑셀 문자 단위 -> px 근사치: width * 7 + 5)
  $colWidths = @{}
  if ($sheet.worksheet.cols) {
    foreach ($col in $sheet.worksheet.cols.col) {
      $wMin = [int]$col.min; $wMax = [int]$col.max
      $wPx = 20
      if ($col.width) {
        $wNum = 0.0
        if ([double]::TryParse($col.width, [ref]$wNum)) { $wPx = [int]([math]::Round($wNum * 7 + 5)) }
      }
      for ($ci = $wMin; $ci -le $wMax; $ci++) { $colWidths[$ci] = $wPx }
    }
  }

  $grid = @{}
  $rowHeights = @{}
  $maxCol = 0; $maxRow = 0
  foreach ($row in $sheet.worksheet.sheetData.row) {
    $rIdx = [int]$row.r
    if ($rIdx -gt $maxRow) { $maxRow = $rIdx }
    if ($row.ht) {
      $hNum = 0.0
      if ([double]::TryParse($row.ht, [ref]$hNum)) { $rowHeights[$rIdx] = [int][math]::Round($hNum * 1.33) }
    }
    foreach ($c in $row.c) {
      if ($c.r -match '^([A-Z]+)(\d+)$') {
        $cIdx = ColLettersToNum $matches[1]
        if ($cIdx -gt $maxCol) { $maxCol = $cIdx }
        $val = $null
        if ($c.v -ne $null) {
          if ($c.t -eq "s") {
            $sIdx = [int]$c.v
            $val = if ($sIdx -ge 0 -and $sIdx -lt $strings.Count) { $strings[$sIdx] } else { "" }
          }
          else { $val = $c.v }
        }
        $styleIdx = 0
        if ($c.s) { [void][int]::TryParse($c.s, [ref]$styleIdx) }
        $numFmtId = if ($styleIdx -ge 0 -and $styleIdx -lt $cellXfs.Count) { $cellXfs[$styleIdx].numFmtId } else { 0 }
        $kind = Get-FormatKind $numFmtId
        $grid["$cIdx,$rIdx"] = @{ text = (Format-CellValue $val $kind); style = $styleIdx }
      }
    }
  }

  # ---- 행 그룹(운행 블록) 경계 계산: 병합된 셀 블록 중간을 잘라서는 안 되므로,
  #      "안전하게 자를 수 있는 위치"(어떤 병합도 걸쳐있지 않은 행 경계)만 페이지 경계로 사용한다.
  $unsafeAfter = @{}
  foreach ($span in $mergeAnchorSpan.Values) { }
  foreach ($key in $mergeAnchorSpan.Keys) {
    $span = $mergeAnchorSpan[$key]
    if ($span.rowspan -gt 1) {
      $rParts = $key -split ","
      $r1 = [int]$rParts[1]
      $r2 = $r1 + $span.rowspan - 1
      for ($rr = $r1; $rr -lt $r2; $rr++) { $unsafeAfter[$rr] = $true }
    }
  }

  # 맨 위 제목/사업소/날짜 등 머리글 행 수 = 1열(번호 칸)에 첫 rowspan 병합이 시작되는 행의 바로 앞까지
  $firstDataRow = $maxRow + 1
  foreach ($key in $mergeAnchorSpan.Keys) {
    $parts2 = $key -split ","
    $cIdx2 = [int]$parts2[0]; $rIdx2 = [int]$parts2[1]
    if ($cIdx2 -eq 1 -and $mergeAnchorSpan[$key].rowspan -gt 1 -and $rIdx2 -lt $firstDataRow) { $firstDataRow = $rIdx2 }
  }
  $headerRowEnd = if ($firstDataRow -le $maxRow) { $firstDataRow - 1 } else { 0 }

  function Render-Rows($html, $rowNums) {
    foreach ($r in $rowNums) {
      $rh = if ($rowHeights.ContainsKey($r)) { $rowHeights[$r] } else { 22 }
      [void]$html.AppendLine("<tr style=`"height:${rh}px`">")
      for ($c = 1; $c -le $maxCol; $c++) {
        $key = "$c,$r"
        if ($mergedAway.ContainsKey($key)) { continue }
        $cell = $grid[$key]
        $val = if ($cell) { $cell.text } else { "" }
        $styleIdx = if ($cell) { $cell.style } else { 0 }
        if ($val -eq $null) { $val = "" }
        $attrs = ""
        if ($mergeAnchorSpan.ContainsKey($key)) {
          $span = $mergeAnchorSpan[$key]
          if ($span.rowspan -gt 1) { $attrs += " rowspan=`"$($span.rowspan)`"" }
          if ($span.colspan -gt 1) { $attrs += " colspan=`"$($span.colspan)`"" }
        }
        $cssStyle = Build-CellStyle $styleIdx
        if ($cssStyle) { $attrs += " style=`"$cssStyle`"" }
        $escaped = [System.Web.HttpUtility]::HtmlEncode($val) -replace "`n", "<br>"
        [void]$html.AppendLine("<td$attrs>$escaped</td>")
      }
      [void]$html.AppendLine("</tr>")
    }
  }

  $pages = New-Object System.Collections.Generic.List[string]
  $cursor = $headerRowEnd + 1
  while ($cursor -le $maxRow) {
    $pageEnd = [Math]::Min($cursor + $RowsPerPage - 1, $maxRow)
    while ($pageEnd -lt $maxRow -and $unsafeAfter.ContainsKey($pageEnd)) { $pageEnd++ }

    $html = New-Object System.Text.StringBuilder
    [void]$html.AppendLine("<table class=`"dia-table`">")
    [void]$html.Append("<colgroup>")
    for ($c = 1; $c -le $maxCol; $c++) {
      $w = if ($colWidths.ContainsKey($c)) { $colWidths[$c] } else { 40 }
      [void]$html.Append("<col style=`"width:${w}px`">")
    }
    [void]$html.AppendLine("</colgroup>")

    if ($headerRowEnd -ge 1) { Render-Rows $html (1..$headerRowEnd) }
    Render-Rows $html ($cursor..$pageEnd)

    [void]$html.AppendLine("</table>")
    $pages.Add($html.ToString())

    $cursor = $pageEnd + 1
  }
  if ($pages.Count -eq 0) {
    # 데이터 행이 없으면(혹은 병합 정보가 없으면) 전체를 한 페이지로
    $html = New-Object System.Text.StringBuilder
    [void]$html.AppendLine("<table class=`"dia-table`">")
    [void]$html.Append("<colgroup>")
    for ($c = 1; $c -le $maxCol; $c++) {
      $w = if ($colWidths.ContainsKey($c)) { $colWidths[$c] } else { 40 }
      [void]$html.Append("<col style=`"width:${w}px`">")
    }
    [void]$html.AppendLine("</colgroup>")
    Render-Rows $html (1..$maxRow)
    [void]$html.AppendLine("</table>")
    $pages.Add($html.ToString())
  }

  for ($pi = 0; $pi -lt $pages.Count; $pi++) {
    $outPath = Join-Path $OutDir ("table_{0}_p{1}.html" -f $sheetName, ($pi + 1))
    [System.IO.File]::WriteAllText($outPath, $pages[$pi], [System.Text.Encoding]::UTF8)
  }
  $sheetHtmlByName[$sheetName] = $pages
  Write-Output "$sheetName : rows=$maxRow cols=$maxCol -> $($pages.Count)페이지 (헤더행 1-$headerRowEnd 고정 반복)"
 } catch {
   Write-Output "ERROR in sheet $($sheetNode.name): $($_.Exception.Message) at line $($_.InvocationInfo.ScriptLineNumber): $($_.InvocationInfo.Line.Trim())"
 }
}

# ---------- (선택) 통합 JS 데이터 파일 생성 ----------
if ($DataJsOut) {
  $json = $sheetHtmlByName | ConvertTo-Json -Depth 5 -Compress
  $depotKeyJson = ($DepotKey | ConvertTo-Json -Compress)
  $js = "// 자동 생성 파일 - xlsx_to_html.ps1 로 재생성됨. 직접 수정하지 말 것.`n" +
        "window.DIA_DATA = window.DIA_DATA || {};`n" +
        "window.DIA_DATA[$depotKeyJson] = $json;`n"
  New-Item -ItemType Directory -Force -Path (Split-Path $DataJsOut) | Out-Null
  [System.IO.File]::WriteAllText($DataJsOut, $js, [System.Text.Encoding]::UTF8)
  Write-Output "DIA_DATA[$DepotKey] -> $DataJsOut"
}
