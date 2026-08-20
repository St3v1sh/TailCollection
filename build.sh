#!/bin/bash
# Build the Twitch Extension zip for upload to the Extension dashboard.

set -e

ZIP_NAME="index.zip"
FILES="index.html index.js parse-ini.js style.css favicon.png"

rm -f "$ZIP_NAME"

if command -v zip &> /dev/null; then
    zip "$ZIP_NAME" $FILES
elif command -v python3 &> /dev/null; then
    python3 -c "
import zipfile, sys
with zipfile.ZipFile('$ZIP_NAME', 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in '$FILES'.split():
        zf.write(f)
"
else
    echo "Error: neither 'zip' nor 'python3' found." >&2
    exit 1
fi

echo "✓ Created $ZIP_NAME"
