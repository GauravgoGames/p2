#!/bin/bash

echo "=== Building Server ====="
npm install -g esbuild
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
echo "=== Server Build Complete ==="
