#!/usr/bin/env bash
# deploy.sh — Convert plain HTML to HubL templates and upload to HubSpot
# Usage: ./deploy.sh [file.html ...]
# If no files specified, converts all HTML pages.
set -euo pipefail

BUILD_DIR="hubspot-build"
HUBSPOT_DIR="solentrex-website"

# Page slug mapping: filename → HubSpot slug
declare -A SLUGS=(
  [index.html]="/home"
  [platform.html]="/platform"
  [integrations.html]="/integrations"
  [partners.html]="/partners"
  [about.html]="/about"
  [demo.html]="/demo"
  [privacy.html]="/privacy"
  [terms.html]="/terms"
  [crm-demo.html]="/crm-demo"
)

# HubSpot template labels
declare -A LABELS=(
  [index.html]="Home"
  [platform.html]="Platform"
  [integrations.html]="Integrations"
  [partners.html]="Partners"
  [about.html]="About"
  [demo.html]="Demo"
  [privacy.html]="Privacy Policy"
  [terms.html]="Terms of Use"
  [crm-demo.html]="CRM Demo"
)

# Files to convert (default: all pages)
if [ $# -gt 0 ]; then
  FILES=("$@")
else
  FILES=(index.html platform.html integrations.html partners.html about.html demo.html privacy.html terms.html crm-demo.html)
fi

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "Converting ${#FILES[@]} files to HubL format..."

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  SKIP: $file (not found)"
    continue
  fi

  label="${LABELS[$file]:-$file}"
  echo "  Converting: $file → $BUILD_DIR/$file (label: $label)"

  # Start with template annotation
  {
    echo "<!--"
    echo "  templateType: page"
    echo "  isAvailableForNewContent: true"
    echo "  label: $label"
    echo "-->"
  } > "$BUILD_DIR/$file"

  # Process the HTML content
  sed \
    -e 's|href="index\.html"|href="/home"|g' \
    -e 's|href="platform\.html"|href="/platform"|g' \
    -e 's|href="integrations\.html"|href="/integrations"|g' \
    -e 's|href="partners\.html"|href="/partners"|g' \
    -e 's|href="about\.html"|href="/about"|g' \
    -e 's|href="demo\.html"|href="/demo"|g' \
    -e 's|href="privacy\.html"|href="/privacy"|g' \
    -e 's|href="terms\.html"|href="/terms"|g' \
    -e 's|href="platform\.html#demo"|href="/platform#demo"|g' \
    -e "s|src=\"crm-demo\.html\"|src=\"/crm-demo\"|g" \
    -e "s|src=\"assets/|src=\"{{ get_asset_url('$HUBSPOT_DIR/assets/|g" \
    -e "s|src=\"img/|src=\"{{ get_asset_url('$HUBSPOT_DIR/img/|g" \
    -e "s|src=\"js/|src=\"{{ get_asset_url('$HUBSPOT_DIR/js/|g" \
    -e "s|href=\"css/|href=\"{{ get_asset_url('$HUBSPOT_DIR/css/|g" \
    -e "s|href=\"assets/|href=\"{{ get_asset_url('$HUBSPOT_DIR/assets/|g" \
    -e "s|{{ get_asset_url('$HUBSPOT_DIR/\([^']*\)'|{{ get_asset_url('$HUBSPOT_DIR/\1') }}|g" \
    "$file" >> "$BUILD_DIR/$file"

  # Fix get_asset_url — the sed above adds the opening but we need to close each one properly
  # The pattern creates: {{ get_asset_url('solentrex-website/path/to/file.ext' ...
  # We need them to be: {{ get_asset_url('solentrex-website/path/to/file.ext') }}
  # Re-process to fix any remaining unclosed get_asset_url patterns
  sed -i \
    -e "s|{{ get_asset_url('${HUBSPOT_DIR}/\([^'\"]*\)\"|{{ get_asset_url('${HUBSPOT_DIR}/\1') }}\"|g" \
    "$BUILD_DIR/$file"

  # Add standard_header_includes after first <head> tag (on the line after <head>)
  sed -i '/<head>/a\    {{ standard_header_includes }}' "$BUILD_DIR/$file"

  # Add standard_footer_includes before </html>
  sed -i 's|</html>|{{ standard_footer_includes }}\n</html>|' "$BUILD_DIR/$file"
done

echo ""
echo "Build complete. Files in $BUILD_DIR/"
echo ""

# Upload to HubSpot if hs CLI is available
if command -v hs &> /dev/null; then
  echo "Uploading to HubSpot..."

  # Upload all asset directories first
  echo "  Uploading assets..."
  for dir in css js assets img; do
    if [ -d "$dir" ]; then
      hs upload "$dir" "$HUBSPOT_DIR/$dir" 2>/dev/null || echo "    Warning: $dir upload may have had issues"
    fi
  done

  # Upload converted HTML templates
  echo "  Uploading templates..."
  for file in "${FILES[@]}"; do
    if [ -f "$BUILD_DIR/$file" ]; then
      hs upload "$BUILD_DIR/$file" "$HUBSPOT_DIR/$file" 2>/dev/null && echo "    Uploaded: $file" || echo "    Warning: $file upload may have had issues"
    fi
  done

  echo ""
  echo "Upload complete. Remember to publish/republish pages in HubSpot."
else
  echo "HubSpot CLI (hs) not found. To upload manually:"
  echo "  hs upload css $HUBSPOT_DIR/css"
  echo "  hs upload js $HUBSPOT_DIR/js"
  echo "  hs upload assets $HUBSPOT_DIR/assets"
  echo "  hs upload img $HUBSPOT_DIR/img"
  for file in "${FILES[@]}"; do
    echo "  hs upload $BUILD_DIR/$file $HUBSPOT_DIR/$file"
  done
fi

echo ""
echo "Done!"
