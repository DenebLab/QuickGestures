#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseVersion(versionString) {
  const match = (versionString || '').match(/^\s*(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) throw new Error(`Cannot parse version from "${versionString}"`);
  return { 
    major: parseInt(match[1], 10), 
    minor: parseInt(match[2], 10), 
    patch: parseInt(match[3] || '0', 10) 
  };
}

function getCommitCount() {
  try {
    const count = execSync('git rev-list --count HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return parseInt(count, 10) || 0;
  } catch {
    return 0;
  }
}

function calculateVersion() {
  try {
    // Read base version from version.txt
    const versionFile = path.join(__dirname, '../version.txt');
    const baseVersionString = fs.readFileSync(versionFile, 'utf8').trim();
    const baseVersion = parseVersion(baseVersionString);
    
    console.log(`📖 Base version from version.txt: ${baseVersionString}`);
    
    // Get commit count as increment
    const increment = getCommitCount();
    console.log(`📊 Commit count increment: ${increment}`);
    
    // Calculate final version: base.patch + increment
    const finalPatch = baseVersion.patch + increment;
    const finalVersion = `${baseVersion.major}.${baseVersion.minor}.${finalPatch}`;
    
    return finalVersion;
  } catch (error) {
    console.error('❌ Error calculating version:', error.message);
    process.exit(1);
  }
}

function updateVersionFiles(version) {
  try {
    // Update package.json
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    // Update manifest.json
    const manifestJsonPath = path.join(__dirname, '../manifest.json');
    const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
    manifestJson.version = version;
    fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n');
    
    console.log(`✅ Updated versions to: ${version}`);
    return version;
  } catch (error) {
    console.error('❌ Error updating version files:', error.message);
    process.exit(1);
  }
}

function runBuild() {
  try {
    console.log('🔨 Running build...');
    execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

function main() {
  console.log('🚀 Starting local build with semver...\n');
  
  // Calculate next version using existing semver-js
  const newVersion = calculateVersion();
  console.log(`📦 Calculated version: ${newVersion}`);
  
  // Update package.json and manifest.json
  updateVersionFiles(newVersion);
  
  // Run the build process
  runBuild();
  
  console.log('\n🎉 Local build complete!');
  console.log(`📁 Extension ready in ./dist directory`);
  console.log(`📋 Version: ${newVersion}`);
  console.log('\n💡 To test: Load unpacked extension from ./dist in Chrome');
}

if (require.main === module) {
  main();
}