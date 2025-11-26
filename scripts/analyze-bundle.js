#!/usr/bin/env node
/**
 * Bundle Size Analyzer - Tier 2 Performance Monitoring
 * 
 * Analyzes production build bundle sizes and provides warnings
 * for bundles exceeding recommended thresholds.
 * 
 * THRESHOLDS:
 * - Main bundle: 100KB (gzipped) - Warning at 150KB
 * - Vendor bundle: 200KB (gzipped) - Warning at 250KB
 * - CSS: 20KB (gzipped) - Warning at 30KB
 * - Individual chunks: 50KB (gzipped) - Warning at 75KB
 * 
 * @fileoverview Bundle size analysis script (Tier 2)
 * @version 2.0.0
 */

import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THRESHOLDS = {
  mainJs: { warn: 150 * 1024, error: 200 * 1024 },
  vendorJs: { warn: 250 * 1024, error: 300 * 1024 },
  css: { warn: 30 * 1024, error: 50 * 1024 },
  chunk: { warn: 75 * 1024, error: 100 * 1024 }
};

/**
 * Get file size in bytes and gzipped size
 */
function getFileSizes(filePath) {
  const content = fs.readFileSync(filePath);
  const size = content.length;
  const gzipSize = gzipSync(content).length;
  
  return { size, gzipSize };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get status indicator based on size and thresholds
 */
function getStatus(gzipSize, thresholds) {
  if (gzipSize >= thresholds.error) return { icon: '🔴', label: 'ERROR' };
  if (gzipSize >= thresholds.warn) return { icon: '🟡', label: 'WARN' };
  return { icon: '🟢', label: 'OK' };
}

/**
 * Analyze bundle directory
 */
function analyzeBundles() {
  const publicDir = path.join(process.cwd(), 'dist', 'public');
  const assetsDir = path.join(publicDir, 'assets');
  
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Build directory not found. Run npm run build first.');
    process.exit(1);
  }

  console.log('\n📦 Bundle Size Analysis\n');
  console.log('=' .repeat(80));
  
  const files = fs.readdirSync(assetsDir);
  const results = [];
  let totalSize = 0;
  let totalGzipSize = 0;
  let hasWarnings = false;
  let hasErrors = false;

  // Analyze each file
  files.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    
    if (!stats.isFile()) return;
    
    const { size, gzipSize } = getFileSizes(filePath);
    totalSize += size;
    totalGzipSize += gzipSize;

    // Determine file type and thresholds
    let thresholds = THRESHOLDS.chunk;
    if (file.includes('index') && file.endsWith('.js')) {
      thresholds = THRESHOLDS.mainJs;
    } else if (file.includes('vendor') && file.endsWith('.js')) {
      thresholds = THRESHOLDS.vendorJs;
    } else if (file.endsWith('.css')) {
      thresholds = THRESHOLDS.css;
    }

    const status = getStatus(gzipSize, thresholds);
    
    if (status.label === 'WARN') hasWarnings = true;
    if (status.label === 'ERROR') hasErrors = true;

    results.push({
      file,
      size,
      gzipSize,
      status,
      threshold: formatBytes(thresholds.warn)
    });
  });

  // Sort by gzip size descending
  results.sort((a, b) => b.gzipSize - a.gzipSize);

  // Print results
  console.log(`${'File'.padEnd(40)} ${'Size'.padEnd(12)} ${'Gzip'.padEnd(12)} Status`);
  console.log('-'.repeat(80));
  
  results.forEach(({ file, size, gzipSize, status, threshold }) => {
    const fileName = file.length > 38 ? file.substring(0, 35) + '...' : file;
    console.log(
      `${fileName.padEnd(40)} ${formatBytes(size).padEnd(12)} ` +
      `${formatBytes(gzipSize).padEnd(12)} ${status.icon} ${status.label}`
    );
    
    if (status.label !== 'OK') {
      console.log(`  └─ Threshold: ${threshold} (gzipped)`);
    }
  });

  console.log('='.repeat(80));
  console.log(`Total: ${formatBytes(totalSize)} (${formatBytes(totalGzipSize)} gzipped)`);
  console.log('');

  // Print summary
  if (hasErrors) {
    console.log('🔴 BUNDLE SIZE ERRORS DETECTED');
    console.log('   Some bundles exceed maximum recommended sizes.');
    console.log('   Consider code splitting or removing unused dependencies.\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('🟡 BUNDLE SIZE WARNINGS');
    console.log('   Some bundles are approaching size limits.');
    console.log('   Monitor bundle growth and optimize if needed.\n');
  } else {
    console.log('✅ All bundles within recommended size limits!\n');
  }

  // Performance recommendations
  console.log('💡 Performance Tips:');
  console.log('  - Target: <100KB gzipped for main bundle');
  console.log('  - Use code splitting for large features');
  console.log('  - Lazy load non-critical components');
  console.log('  - Remove unused dependencies with npm prune\n');
}

// Run analyzer
try {
  analyzeBundles();
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
  process.exit(1);
}
