#!/usr/bin/env node

const { execSync } = require('child_process');

function releaseToProduction() {
  console.log('🚀 Preparing production release...');
  
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    
    // Check current branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    console.log(`📍 Current branch: ${currentBranch}`);
    
    // Check for uncommitted changes
    try {
      execSync('git diff-index --quiet HEAD --', { stdio: 'pipe' });
    } catch {
      console.log('⚠️  You have uncommitted changes. Please commit them first.');
      process.exit(1);
    }
    
    // Fetch latest changes
    console.log('📥 Fetching latest changes...');
    execSync('git fetch origin', { stdio: 'inherit' });
    
    // Check if production branch exists
    let productionExists = false;
    try {
      execSync('git rev-parse --verify origin/production', { stdio: 'pipe' });
      productionExists = true;
    } catch {
      console.log('🆕 Production branch does not exist, creating it...');
    }
    
    // Switch to or create production branch
    if (productionExists) {
      console.log('🔄 Switching to production branch...');
      execSync('git checkout production', { stdio: 'inherit' });
      execSync('git pull origin production', { stdio: 'inherit' });
    } else {
      console.log('🌱 Creating production branch...');
      execSync('git checkout -b production', { stdio: 'inherit' });
    }
    
    // Merge current branch into production
    if (currentBranch !== 'production') {
      console.log(`🔀 Merging ${currentBranch} into production...`);
      execSync(`git merge ${currentBranch}`, { stdio: 'inherit' });
    }
    
    // Build and test
    console.log('🔨 Building extension...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Push to production
    console.log('🚀 Pushing to production branch...');
    execSync('git push origin production', { stdio: 'inherit' });
    
    console.log('✅ Production release initiated!');
    console.log('🔗 Check GitHub Actions for release progress: https://github.com/your-repo/actions');
    console.log('📦 The release will be created automatically with auto-incremented version.');
    
    // Switch back to original branch
    if (currentBranch !== 'production') {
      console.log(`🔄 Switching back to ${currentBranch}...`);
      execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });
    }
    
  } catch (error) {
    console.error('❌ Error during production release:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  releaseToProduction();
}

module.exports = { releaseToProduction };