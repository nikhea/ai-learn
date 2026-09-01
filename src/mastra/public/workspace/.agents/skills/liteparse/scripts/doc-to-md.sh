#!/bin/bash

# Document to Markdown Converter (DOCX, PPTX, XLSX, etc.)
# Usage: ./doc-to-md.sh <input.file> [output.md]

set -e

INPUT_FILE="$1"
OUTPUT_FILE="${2:-$(basename "$INPUT_FILE" | sed 's/\.[^.]*$//').md}"

if [ -z "$INPUT_FILE" ]; then
    echo "Usage: $0 <input.file> [output.md]"
    echo ""
    echo "Supported formats:"
    echo "  - .doc, .docx, .docm, .odt, .rtf (Word)"
    echo "  - .ppt, .pptx, .pptm, .odp (PowerPoint)"
    echo "  - .xls, .xlsx, .xlsm, .ods, .csv (Excel)"
    echo "  - .jpg, .jpeg, .png, .gif, .bmp, .tiff (Images)"
    echo ""
    echo "Note: Office files require LibreOffice, images require ImageMagick"
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: File '$INPUT_FILE' not found"
    exit 1
fi

EXTENSION="${INPUT_FILE##*.}"
EXTENSION=$(echo "$EXTENSION" | tr '[:upper:]' '[:lower:]')

echo "Converting $INPUT_FILE to Markdown..."

TEMP_JSON=$(mktemp).json

lit parse "$INPUT_FILE" --format json -o "$TEMP_JSON"

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