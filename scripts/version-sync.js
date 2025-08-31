#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function syncVersions() {
  const targetVersion = process.env.TARGET_VERSION?.replace(/^v/, '') || null;
  
  // Read current versions
  const packageJsonPath = path.join(__dirname, '../package.json');
  const manifestJsonPath = path.join(__dirname, '../manifest.json');
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
  
  console.log(`Current versions:`);
  console.log(`- package.json: ${packageJson.version}`);
  console.log(`- manifest.json: ${manifestJson.version}`);
  
  // Determine the version to use
  let finalVersion;
  
  if (targetVersion) {
    finalVersion = targetVersion;
    console.log(`Using target version: ${finalVersion}`);
  } else {
    // Use the higher version between the two files
    const packageVersion = packageJson.version.split('.').map(Number);
    const manifestVersion = manifestJson.version.split('.').map(Number);
    
    let usePackageVersion = false;
    for (let i = 0; i < 3; i++) {
      if (packageVersion[i] > manifestVersion[i]) {
        usePackageVersion = true;
        break;
      } else if (packageVersion[i] < manifestVersion[i]) {
        break;
      }
    }
    
    finalVersion = usePackageVersion ? packageJson.version : manifestJson.version;
    console.log(`Using higher version: ${finalVersion}`);
  }
  
  // Update both files
  packageJson.version = finalVersion;
  manifestJson.version = finalVersion;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n');
  
  console.log(`✅ Synced versions to: ${finalVersion}`);
  
  return finalVersion;
}

if (require.main === module) {
  try {
    syncVersions();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing versions:', error.message);
    process.exit(1);
  }
}

module.exports = { syncVersions };