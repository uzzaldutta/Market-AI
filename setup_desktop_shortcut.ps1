$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$ShortcutPath = Join-Path -Path $DesktopPath -ChildPath "Bharat Market AI.lnk"
$TargetBat = Join-Path -Path $PSScriptRoot -ChildPath "start_bharat_market_ai.bat"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetBat
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "Bharat Market AI - Autonomous Market Intelligence & Retail Trading Desk"
$Shortcut.IconLocation = "shell32.dll,13"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully at: $ShortcutPath" -ForegroundColor Green
