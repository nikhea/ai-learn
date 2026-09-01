#!/bin/bash

# Universal Document to Markdown Converter (via LiteParse)
# Supports: PDF, DOCX, PPTX, XLSX, ODT, RTF, images, and more
#
# Usage:
#   ./to-md.sh <input.file> [output.md] [options]
#
# Options:
#   --no-ocr          Skip OCR (faster, text-layer PDFs only)
#   --dpi <n>         Render DPI (default: 150)
#   --pages <range>   Page range, e.g. "1-5,10,15-20"
#   --ocr-lang <lang> OCR language code (default: eng)
#   --screenshots     Also save page screenshots alongside the .md

set -e

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }
error() { echo -e "${RED}✗${NC} $*" >&2; exit 1; }

# ── Usage ─────────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: $(basename "$0") <input.file> [output.md] [options]

Supported formats:
  PDF              .pdf
  Word             .doc .docx .docm .odt .rtf        (requires LibreOffice)
  PowerPoint       .ppt .pptx .pptm .odp             (requires LibreOffice)
  Excel            .xls .xlsx .xlsm .ods .csv .tsv   (requires LibreOffice)
  Images           .jpg .jpeg .png .gif .bmp .tiff    (requires ImageMagick)

Options:
  --no-ocr          Disable OCR
  --dpi <n>         Rendering DPI (default: 150)
  --pages <range>   Pages to parse, e.g. "1-5,10"
  --ocr-lang <lang> Tesseract language code (default: eng)
  --screenshots     Save page screenshots to <output_dir>/screenshots/

Examples:
  $(basename "$0") report.pdf
  $(basename "$0") report.pdf report.md --pages 1-10 --dpi 200
  $(basename "$0") deck.pptx summary.md --no-ocr
  $(basename "$0") scan.pdf  scan.md    --ocr-lang fra
  $(basename "$0") report.pdf report.md --screenshots
EOF
  exit 1
}

# ── Argument parsing ──────────────────────────────────────────────────────────
INPUT_FILE=""
OUTPUT_FILE=""
OCR_ENABLED=true
DPI=150
PAGES=""
OCR_LANG="eng"
SCREENSHOTS=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-ocr)       OCR_ENABLED=false; shift ;;
    --dpi)          DPI="$2"; shift 2 ;;
    --pages)        PAGES="$2"; shift 2 ;;
    --ocr-lang)     OCR_LANG="$2"; shift 2 ;;
    --screenshots)  SCREENSHOTS=true; shift ;;
    --help|-h)      usage ;;
    -*)             error "Unknown option: $1" ;;
    *)
      if [[ -z "$INPUT_FILE" ]]; then INPUT_FILE="$1"
      elif [[ -z "$OUTPUT_FILE" ]]; then OUTPUT_FILE="$1"
      else error "Unexpected argument: $1"
      fi
      shift ;;
  esac
done

[[ -z "$INPUT_FILE" ]] && usage
[[ ! -f "$INPUT_FILE" ]] && error "File not found: $INPUT_FILE"

# Default output filename = input basename with .md extension
OUTPUT_FILE="${OUTPUT_FILE:-$(basename "$INPUT_FILE" | sed 's/\.[^.]*$//').md}"
OUTPUT_DIR="$(dirname "$OUTPUT_FILE")"
mkdir -p "$OUTPUT_DIR"

EXTENSION="${INPUT_FILE##*.}"
EXTENSION=$(echo "$EXTENSION" | tr '[:upper:]' '[:lower:]')

# ── Dependency checks ─────────────────────────────────────────────────────────
check_dep() {
  command -v "$1" &>/dev/null || error "$1 is required but not installed. $2"
}

check_dep lit "Run: npm i -g @llamaindex/liteparse"
check_dep node "Run: https://nodejs.org"

case "$EXTENSION" in
  doc|docx|docm|odt|rtf|ppt|pptx|pptm|odp|xls|xlsx|xlsm|ods|csv|tsv)
    check_dep libreoffice "Run: brew install --cask libreoffice  (or apt-get install libreoffice)" ;;
  jpg|jpeg|png|gif|bmp|tiff|webp|svg)
    check_dep convert "Run: brew install imagemagick  (or apt-get install imagemagick)" ;;
esac

# ── Tesseract data (auto-download for OCR) ────────────────────────────────────
if [[ "$OCR_ENABLED" == true ]]; then
  TESSDATA_DIR="$HOME/tessdata"
  mkdir -p "$TESSDATA_DIR"
  TRAINEDDATA="$TESSDATA_DIR/${OCR_LANG}.traineddata"

  if [[ ! -f "$TRAINEDDATA" ]]; then
    warn "Tesseract data for '$OCR_LANG' not found. Downloading..."
    TESS_URL="https://github.com/tesseract-ocr/tessdata/raw/main/${OCR_LANG}.traineddata"
    if command -v wget &>/dev/null; then
      wget -q -O "$TRAINEDDATA" "$TESS_URL" || error "Failed to download Tesseract data."
    elif command -v curl &>/dev/null; then
      curl -fsSL -o "$TRAINEDDATA" "$TESS_URL" || error "Failed to download Tesseract data."
    else
      error "Neither wget nor curl found. Install one to download Tesseract data."
    fi
    info "Tesseract '$OCR_LANG' data downloaded"
  fi

  export TESSDATA_PREFIX="$TESSDATA_DIR"
fi

# ── Build lit parse flags ─────────────────────────────────────────────────────
LIT_ARGS=(--format json)
[[ "$OCR_ENABLED" == false ]] && LIT_ARGS+=(--no-ocr)
[[ -n "$PAGES" ]]             && LIT_ARGS+=(--target-pages "$PAGES")
LIT_ARGS+=(--dpi "$DPI")
[[ "$OCR_ENABLED" == true ]]  && LIT_ARGS+=(--ocr-language "$OCR_LANG")

# ── Parse ─────────────────────────────────────────────────────────────────────
TEMP_JSON=$(mktemp).json
TITLE="$(basename "$OUTPUT_FILE" .md)"

echo ""
echo "Converting: $INPUT_FILE → $OUTPUT_FILE"
echo "  OCR: $OCR_ENABLED  |  DPI: $DPI  |  Pages: ${PAGES:-all}  |  Lang: $OCR_LANG"
echo ""

lit parse "$INPUT_FILE" "${LIT_ARGS[@]}" -o "$TEMP_JSON"

# ── JSON → Markdown ───────────────────────────────────────────────────────────
node -e "
const fs = require('fs');
const raw = fs.readFileSync('$TEMP_JSON', 'utf8');
const data = JSON.parse(raw);
const pages = data.pages ?? [];

const frontmatter = [
  '---',
  'title: \"$TITLE\"',
  'source: \"$INPUT_FILE\"',
  'pages: ' + pages.length,
  'generated: \"' + new Date().toISOString() + '\"',
  '---',
  '',
].join('\n');

let md = frontmatter + '# $TITLE\n\n';

pages.forEach(page => {
  const text = (page.text ?? '').trim();
  if (text) {
    md += '## Page ' + page.page + '\n\n' + text + '\n\n---\n\n';
  }
});

fs.writeFileSync('$OUTPUT_FILE', md.trimEnd() + '\n');
console.log('Pages converted: ' + pages.length);
"

rm -f "$TEMP_JSON"

# ── Optional screenshots ──────────────────────────────────────────────────────
if [[ "$SCREENSHOTS" == true ]]; then
  SHOT_DIR="$(dirname "$OUTPUT_FILE")/screenshots"
  mkdir -p "$SHOT_DIR"
  PAGE_ARG=${PAGES:-}
  if [[ -n "$PAGE_ARG" ]]; then
    lit screenshot "$INPUT_FILE" --target-pages "$PAGE_ARG" --dpi "$DPI" -o "$SHOT_DIR" -q
  else
    lit screenshot "$INPUT_FILE" --dpi "$DPI" -o "$SHOT_DIR" -q
  fi
  info "Screenshots saved: $SHOT_DIR"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
info "Output : $OUTPUT_FILE"
info "Size   : $(du -h "$OUTPUT_FILE" | cut -f1)"
[[ "$SCREENSHOTS" == true ]] && info "Screenshots: $(dirname "$OUTPUT_FILE")/screenshots/"