# 🚀 Installation Guide

## Method 1: Chrome Web Store (Recommended)
*Coming soon - extension will be published to Chrome Web Store*

## Method 2: Developer Installation

### Prerequisites
- Google Chrome browser
- Node.js 18+ (for building from source)
- Basic command line knowledge

### Step 1: Get the Code
```bash
# Clone the repository
git clone https://github.com/your-username/QuickGestures.git
cd QuickGestures
```

### Step 2: Build the Extension
```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist` folder with the compiled extension.

### Step 3: Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"** 
4. Select the `dist` folder from your QuickGestures directory
5. The extension icon should appear in your toolbar

### Step 4: Verify Installation
1. Right-click on any webpage
2. Try drawing a simple gesture (like ⬅ for "Go Back")
3. You should see a blue trail following your mouse
4. The gesture should trigger the corresponding action

## Troubleshooting

### Extension Not Loading
- **Check Developer Mode**: Make sure it's enabled in `chrome://extensions/`
- **Build Issues**: Run `npm run clean && npm run build` to rebuild
- **Node Version**: Ensure Node.js 18+ is installed

### Gestures Not Working
- **Check Extension Status**: Ensure it's enabled in `chrome://extensions/`
- **Site Exclusions**: Check if the current site is excluded in options
- **Console Errors**: Check browser console (F12) for error messages

### Performance Issues
- **Disable on Heavy Sites**: Add problematic sites to exclusions
- **Adjust Sensitivity**: Lower recognition thresholds in options
- **Clear Cache**: Reload the extension or restart Chrome

## Updating the Extension

### From Source
```bash
# Pull latest changes
git pull origin main

# Rebuild
npm run build

# Reload extension in Chrome
# Go to chrome://extensions/ and click the refresh icon
```

### Automatic Updates
Once published to Chrome Web Store, updates will be automatic.

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "QuickGestures" 
3. Click **"Remove"**
4. Confirm removal

All settings and data will be removed from Chrome storage.

## Development Installation

For developers who want to modify the extension:

```bash
# Install dependencies
npm install

# Start development mode (auto-rebuild on changes)
npm run dev

# In Chrome, reload the extension after changes
```

The `npm run dev` command watches for file changes and rebuilds automatically, but you'll still need to refresh the extension in Chrome to see changes.