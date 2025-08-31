const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const copyFile = (src, dest) => {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
};

const copyAssets = () => {
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  copyFile('manifest.json', 'dist/manifest.json');
  
  if (fs.existsSync('src/options/options.html')) {
    copyFile('src/options/options.html', 'dist/options/options.html');
  }
  
  if (fs.existsSync('src/options/options.css')) {
    copyFile('src/options/options.css', 'dist/options/options.css');
  }
  
  if (fs.existsSync('src/assets')) {
    const copyDir = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const entries = fs.readdirSync(src);
      for (const entry of entries) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        if (fs.statSync(srcPath).isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          copyFile(srcPath, destPath);
        }
      }
    };
    copyDir('src/assets', 'dist/assets');
  }
};

const commonOptions = {
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"'
  }
};

const serviceWorkerOptions = {
  ...commonOptions,
  entryPoints: ['src/background/service-worker.ts'],
  outfile: 'dist/background/service-worker.js',
  format: 'iife'
};

const contentScriptOptions = {
  ...commonOptions,
  entryPoints: ['src/content/content-script.ts'],
  outfile: 'dist/content/content-script.js',
  format: 'iife'
};

const optionsOptions = {
  ...commonOptions,
  entryPoints: ['src/options/options.ts'],
  outfile: 'dist/options/options.js',
  format: 'iife'
};

const buildAll = async () => {
  try {
    await Promise.all([
      esbuild.build(serviceWorkerOptions),
      esbuild.build(contentScriptOptions),
      esbuild.build(optionsOptions)
    ]);
    copyAssets();
    console.log('Build complete');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
};

const watchAll = async () => {
  try {
    const contexts = await Promise.all([
      esbuild.context(serviceWorkerOptions),
      esbuild.context(contentScriptOptions),
      esbuild.context(optionsOptions)
    ]);
    
    await Promise.all(contexts.map(ctx => ctx.watch()));
    copyAssets();
    console.log('Watching for changes...');
  } catch (error) {
    console.error('Watch setup failed:', error);
    process.exit(1);
  }
};

if (isWatch) {
  watchAll();
} else {
  buildAll();
}