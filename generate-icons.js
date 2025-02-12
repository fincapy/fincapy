// Save as generate-icons.js
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const toIco = require('png-to-ico');

async function generateIcons(inputFile) {
  const outputDir = 'pwa-icons';

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.join(outputDir, 'favicon'), { recursive: true });

  // High-quality resizing options
  const resizeOptions = {
    fit: sharp.fit.contain,
    background: { r: 255, g: 255, b: 255, alpha: 0 },
    withoutEnlargement: true,
    kernel: sharp.kernel.lanczos3,
  };

  // PWA and Android icons
  const sizes = [36, 48, 72, 96, 144, 192, 256, 384, 512];
  for (const size of sizes) {
    await sharp(inputFile)
      .resize(size, size, resizeOptions)
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(outputDir, `android-chrome-${size}x${size}.png`));
  }

  // Apple Touch Icons (with special handling for retina displays)
  const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 167, 180, 1024];
  for (const size of appleSizes) {
    const image = await sharp(inputFile)
      .resize(size, size, resizeOptions)
      .png({ quality: 95, compressionLevel: 9 })
      .toBuffer();

    // Save normal version
    await fs.writeFile(
      path.join(outputDir, `apple-touch-icon-${size}x${size}.png`),
      image
    );

    // Save precomposed version
    await fs.writeFile(
      path.join(outputDir, `apple-touch-icon-${size}x${size}-precomposed.png`),
      image
    );
  }

  // Default apple-touch-icon
  await fs.copyFile(
    path.join(outputDir, 'apple-touch-icon-180x180.png'),
    path.join(outputDir, 'apple-touch-icon.png')
  );

  // Windows Metro tiles
  const metroSizes = [70, 150, 310];
  for (const size of metroSizes) {
    await sharp(inputFile)
      .resize(size, size, resizeOptions)
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(outputDir, `mstile-${size}x${size}.png`));
  }

  // Generate favicon sizes
  const faviconSizes = [16, 32, 48];
  const faviconPaths = [];

  for (const size of faviconSizes) {
    const faviconPath = path.join(
      outputDir,
      'favicon',
      `favicon-${size}x${size}.png`
    );
    await sharp(inputFile)
      .resize(size, size, {
        ...resizeOptions,
        kernel: size <= 32 ? sharp.kernel.nearest : sharp.kernel.lanczos3,
      })
      .png({ quality: 100 })
      .toFile(faviconPath);

    faviconPaths.push(faviconPath);
  }

  // Create multi-size ICO file using png-to-ico
  const icoBuffer = await toIco(faviconPaths);
  await fs.writeFile(path.join(outputDir, 'favicon.ico'), icoBuffer);

  // Generate manifest.json
  const manifest = {
    name: 'Your PWA App',
    short_name: 'PWA App',
    icons: [
      {
        src: 'android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
  };

  await fs.writeFile(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(
    'Icon generation complete! Files are in the "pwa-icons" directory'
  );
  console.log('\nAdd these lines to your HTML <head> section:');
  console.log(`
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#ffffff">
    `);
}

// Check if input file is provided
if (process.argv.length !== 3) {
  console.error('Usage: node generate-icons.js <input-image.png>');
  process.exit(1);
}

generateIcons(process.argv[2]).catch(console.error);
