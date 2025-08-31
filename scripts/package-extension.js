#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createZipWithTar(sourceFiles, outputZip) {
  // Use tar to create archive (available on most systems)
  try {
    const tempTar = outputZip.replace('.zip', '.tar');
    
    // Create tar archive
    const tarCommand = `tar -cf "${tempTar}" ${sourceFiles.join(' ')}`;
    execSync(tarCommand, { stdio: 'pipe' });
    
    // Convert to zip if possible, otherwise keep as tar
    try {
      if (fs.existsSync('/usr/bin/python3') || fs.existsSync('/usr/bin/python')) {
        const pythonCmd = fs.existsSync('/usr/bin/python3') ? 'python3' : 'python';
        const zipScript = `
import zipfile, tarfile, os
with tarfile.open('${tempTar}', 'r') as tar:
    with zipfile.ZipFile('${outputZip}', 'w', zipfile.ZIP_DEFLATED) as zip:
        for member in tar.getmembers():
            if member.isfile():
                data = tar.extractfile(member).read()
                zip.writestr(member.name, data)
os.remove('${tempTar}')
print('ZIP created successfully')
`;
        fs.writeFileSync('temp_zip.py', zipScript);
        execSync(`${pythonCmd} temp_zip.py`, { stdio: 'pipe' });
        fs.unlinkSync('temp_zip.py');
        return outputZip;
      } else {
        // Keep as tar if no zip tools available
        const tarZip = outputZip.replace('.zip', '.tar.gz');
        execSync(`gzip "${tempTar}"`, { stdio: 'pipe' });
        fs.renameSync(`${tempTar}.gz`, tarZip);
        console.log('⚠️  Created .tar.gz instead of .zip (zip tools not available)');
        return tarZip;
      }
    } catch (convertError) {
      console.log('⚠️  Created .tar instead of .zip (conversion failed)');
      return tempTar;
    }
  } catch (error) {
    throw new Error(`Failed to create archive: ${error.message}`);
  }
}

function copyFilesToTemp(files, tempDir) {
  files.forEach(file => {
    const source = file.endsWith('/') ? file.slice(0, -1) : file;
    const dest = path.join(tempDir, path.basename(source));
    
    if (fs.statSync(source).isDirectory()) {
      fs.cpSync(source, dest, { recursive: true });
    } else {
      fs.copyFileSync(source, dest);
    }
  });
}

function packageExtension() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const manifestJson = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  
  const version = manifestJson.version;
  const zipName = `quickgestures-v${version}.zip`;
  
  console.log(`📦 Packaging QuickGestures v${version}...`);
  
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    console.error('❌ dist directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  // Chrome Web Store requires files at root level, not in dist/ subdirectory
  // We'll copy dist contents to temp directory and package that
  const filesToPackage = [
    'README.md',
    'LICENSE'
  ];
  
  // Verify all files exist
  const missingFiles = filesToPackage.filter(file => {
    if (file.endsWith('/')) {
      return !fs.existsSync(file) || !fs.statSync(file).isDirectory();
    }
    return !fs.existsSync(file);
  });
  
  if (missingFiles.length > 0) {
    console.error(`❌ Missing files: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
  
  try {
    // Remove existing package if it exists
    if (fs.existsSync(zipName)) {
      fs.unlinkSync(zipName);
    }
    
    // Create temporary directory for packaging
    const tempDir = `temp_package_${Date.now()}`;
    fs.mkdirSync(tempDir);
    
    try {
      // Copy dist contents to temp directory (at root level for Chrome Web Store)
      console.log('📁 Copying dist contents to package root...');
      const distItems = fs.readdirSync('dist');
      for (const item of distItems) {
        const srcPath = path.join('dist', item);
        const destPath = path.join(tempDir, item);
        if (fs.statSync(srcPath).isDirectory()) {
          fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
      
      // Copy additional files to temp directory
      for (const file of filesToPackage) {
        if (fs.existsSync(file)) {
          fs.copyFileSync(file, path.join(tempDir, path.basename(file)));
        }
      }
      
      // Create ZIP from temp directory
      let finalPackage;
      try {
        // Try zip command first
        const zipCommand = `cd "${tempDir}" && zip -r "../${zipName}" . -x "*.DS_Store" "*node_modules*" "*.git*"`;
        execSync(zipCommand, { stdio: 'pipe' });
        finalPackage = zipName;
        console.log('✅ Used zip command');
      } catch (zipError) {
        // Fallback to tar/python method with corrected file paths
        console.log('⚠️  zip command not available, using alternative method...');
        
        // Change to temp directory and create archive from there
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        
        try {
          const tempFiles = fs.readdirSync('.').filter(f => f !== '.' && f !== '..');
          finalPackage = createZipWithTar(tempFiles, path.join('..', zipName));
          
          // Move back to original directory
          process.chdir(originalCwd);
          
          // Update finalPackage path to be relative to original directory
          finalPackage = zipName;
        } catch (tarError) {
          process.chdir(originalCwd);
          throw tarError;
        }
      }
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      // Get file size
      const stats = fs.statSync(finalPackage);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ Extension packaged successfully!`);
      console.log(`📁 Package: ${finalPackage}`);
      console.log(`📏 Size: ${fileSizeInMB} MB`);
      console.log(`🔗 Ready for Chrome Web Store or GitHub release`);
      
      return finalPackage;
    } catch (error) {
      // Clean up temp directory on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error creating package:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  packageExtension();
}

module.exports = { packageExtension };