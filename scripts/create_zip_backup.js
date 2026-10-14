const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const downloadsDir = path.join(process.env.USERPROFILE || 'C:\\Users\\Angel', 'Downloads');
const zipName = 'mohit-web-portfolio.zip';
const targetZip = path.join(downloadsDir, zipName);

console.log(`📦 Creating clean ZIP of Web Portfolio ONLY...`);
console.log(`🎯 Destination: ${targetZip}`);

try {
  if (fs.existsSync(targetZip)) {
    fs.unlinkSync(targetZip);
  }

  // bsdtar natively creates zip on Windows without including unwanted files
  const excludeFlags = [
    '--exclude="node_modules"',
    '--exclude=".next"',
    '--exclude=".git"',
    '--exclude="radhe-pan-app"',
    '--exclude="*.apk"',
    '--exclude="*.zip"'
  ].join(' ');

  const command = `tar -a -c -f "${targetZip}" ${excludeFlags} *`;
  
  execSync(command, { cwd: rootDir, stdio: 'inherit' });

  if (fs.existsSync(targetZip)) {
    const stats = fs.statSync(targetZip);
    console.log(`\n🎉 Portfolio ZIP successfully created!`);
    console.log(`📁 Saved to: ${targetZip}`);
    console.log(`📊 File Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  } else {
    console.error('ZIP file was not created.');
  }
} catch (error) {
  console.error('Error creating zip backup:', error.message);
}
