#!/bin/sh
DATE=$(date +%y%m%d%H%M)
mkdir -p builds
terser neno.js --compress --mangle --comments false --output builds/neno${DATE}.js
