$exclude = @('.git', 'node_modules', '.next', 'mohit-portfolio-complete-backup.zip')
$items = Get-ChildItem -Path . | Where-Object { $exclude -notcontains $_.Name } | Select-Object -ExpandProperty FullName
Compress-Archive -Path $items -DestinationPath 'mohit-portfolio-complete-backup.zip' -Force
$size = (Get-Item 'mohit-portfolio-complete-backup.zip').Length / 1MB
Write-Host "Backup ZIP created successfully! Size: $([math]::Round($size, 2)) MB"
