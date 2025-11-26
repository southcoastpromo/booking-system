#!/bin/bash
# TIER 2: Build with automatic bundle analysis
# Runs production build and analyzes bundle sizes

set -e

echo "📦 Building client application..."
npm run build:client

echo "🔧 Building server application..."
npm run build:server

echo "📊 Analyzing bundle sizes..."
node scripts/analyze-bundle.js

echo "✅ Build with analysis complete!"
