#!/bin/bash

# PDF to Markdown Parser with OCR Support
# Usage: ./pdf-to-md.sh <input.pdf> [output.md]

set -e

PDF_FILE="$1"
OUTPUT_FILE="${2:-$(basename "$PDF_FILE" .pdf).md}"

if [ -z "$PDF_FILE" ]; then
    echo "Usage: $0 <input.pdf> [output.md]"
    echo "Example: $0 myfile.pdf myfile.md"
    exit 1
fi

if [ ! -f "$PDF_FILE" ]; then
    echo "Error: File '$PDF_FILE' not found"
    exit 1
fi

echo "Setting up Tesseract OCR..."

TESSDATA_DIR="$HOME/tessdata"
mkdir -p "$TESSDATA_DIR"

if [ ! -f "$TESSDATA_DIR/eng.traineddata" ]; then
    echo "Downloading Tesseract English data..."
    wget -q -O "$TESSDATA_DIR/eng.traineddata" \
        https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata
    echo "Tesseract data downloaded"
fi

export TESSDATA_PREFIX="$TESSDATA_DIR"

TEMP_JSON=$(mktemp).json

echo "Parsing PDF with OCR (this may take a while)..."
lit parse "$PDF_FILE" --format json -o "$TEMP_JSON" --dpi 150

echo "Converting to Markdown..."
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$TEMP_JSON', 'utf8'));
let md = '# ' + '$OUTPUT_FILE'.replace('.md', '') + '\n\n---\n\n';
data.pages.forEach(page => {
  md += '## Page ' + page.page + '\n\n' + page.text + '\n\n---\n\n';
});
fs.writeFileSync('$OUTPUT_FILE', md);
console.log('Done');
"

rm -f "$TEMP_JSON"

echo ""
echo "✓ Output: $OUTPUT_FILE"
echo "✓ File size: $(du -h "$OUTPUT_FILE" | cut -f1)"