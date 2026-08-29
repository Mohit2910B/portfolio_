const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const zipName = 'mohit-portfolio-complete-backup.zip';
const zipPath = path.join(rootDir, zipName);

console.log(`📦 Packaging complete project backup to: ${zipName}...`);

// Use PowerShell Compress-Archive to generate standard zip excluding .git, node_modules, .next
const psCommand = `
$exclude = @('.git', 'node_modules', '.next', '${zipName}')
$items = Get-ChildItem -Path . | Where-Object { $exclude -notcontains $_.Name } | Select-Object -ExpandProperty FullName
Compress-Archive -Path $items -DestinationPath '${zipName}' -Force
`;

try {
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  execSync(`powershell -Command "${psCommand.replace(/\n/g, ' ')}"`, { cwd: rootDir, stdio: 'inherit' });
  const stats = fs.statSync(zipPath);
  console.log(`🎉 ZIP backup successfully created!`);
  console.log(`📁 File: ${zipName}`);
  console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
} catch (error) {
  console.error('Error creating zip backup:', error.message);
}
