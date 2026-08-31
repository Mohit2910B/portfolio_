const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

const backupName = `mohit-portfolio-backup-${timestamp}.zip`;
const desktopPath = path.join('C:', 'Users', 'Angel', 'Desktop', backupName);
const downloadsPath = path.join('C:', 'Users', 'Angel', 'Downloads', backupName);
const latestDesktop = path.join('C:', 'Users', 'Angel', 'Desktop', 'mohit-portfolio-complete-backup.zip');
const latestDownloads = path.join('C:', 'Users', 'Angel', 'Downloads', 'mohit-portfolio-complete-backup.zip');
const localBackup = path.join(rootDir, backupName);

console.log(`📦 Creating complete archive: ${backupName}...`);

const psCommand = `$exclude = @('.git', 'node_modules', '.next', 'mohit-portfolio-complete-backup.zip'); $items = Get-ChildItem -Path . | Where-Object { $exclude -notcontains $_.Name } | Select-Object -ExpandProperty FullName; Compress-Archive -Path $items -DestinationPath '${backupName}' -Force`;

try {
  execSync(`powershell -Command "${psCommand}"`, { cwd: rootDir, stdio: 'inherit' });
  
  if (fs.existsSync(localBackup)) {
    fs.copyFileSync(localBackup, desktopPath);
    fs.copyFileSync(localBackup, downloadsPath);
    fs.copyFileSync(localBackup, latestDesktop);
    fs.copyFileSync(localBackup, latestDownloads);
    
    const size = (fs.statSync(localBackup).size / 1024 / 1024).toFixed(2);
    console.log(`\n🎉 SUCCESS! Full Backup successfully created (${size} MB):\n`);
    console.log(`1. Desktop (Timestamped): ${desktopPath}`);
    console.log(`2. Downloads (Timestamped): ${downloadsPath}`);
    console.log(`3. Desktop (Latest): ${latestDesktop}`);
    console.log(`4. Downloads (Latest): ${latestDownloads}`);
  }
} catch (err) {
  console.error('Error creating backup:', err.message);
}
