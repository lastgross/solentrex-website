#!/usr/bin/env bash
# deploy.sh — Convert plain HTML to HubL templates and upload to HubSpot
# Usage: ./deploy.sh [file.html ...]
# If no files specified, converts all HTML pages.
set -euo pipefail

BUILD_DIR="hubspot-build"
HUBSPOT_DIR="solentrex-website"

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

# Use node for reliable multi-match-per-line replacements
node -e "
const fs = require('fs');
const path = require('path');
const dir = '$HUBSPOT_DIR';
const buildDir = '$BUILD_DIR';

const labels = {
  'index.html': 'Home',
  'platform.html': 'Platform',
  'integrations.html': 'Integrations',
  'partners.html': 'Partners',
  'about.html': 'About',
  'demo.html': 'Demo',
  'privacy.html': 'Privacy Policy',
  'terms.html': 'Terms of Use',
  'crm-demo.html': 'CRM Demo'
};

const linkMap = {
  'index.html': '/home',
  'platform.html': '/platform',
  'integrations.html': '/integrations',
  'partners.html': '/partners',
  'about.html': '/about',
  'demo.html': '/demo',
  'privacy.html': '/privacy',
  'terms.html': '/terms',
  'platform.html#demo': '/platform#demo'
};

const files = process.argv.slice(1);
for (const file of files) {
  if (!fs.existsSync(file)) { console.log('  SKIP: ' + file); continue; }
  const label = labels[file] || file;
  console.log('  Converting: ' + file + ' (label: ' + label + ')');

  let html = fs.readFileSync(file, 'utf8');

  // Convert page links: href=\"page.html\" → href=\"/slug\"
  for (const [from, to] of Object.entries(linkMap)) {
    html = html.split('href=\"' + from + '\"').join('href=\"' + to + '\"');
  }

  // Convert iframe src for crm-demo
  html = html.split('src=\"crm-demo.html\"').join('src=\"/crm-demo\"');

  // Convert asset paths to get_asset_url
  // Match src=\"(assets/...|img/...|js/...)\" and href=\"(css/...|assets/...)\"
  html = html.replace(/src=\"((?:assets|img|js)\/[^\"]+)\"/g, 'src=\"{{ get_asset_url(\\'' + dir + '/\$1\\') }}\"');
  html = html.replace(/href=\"((?:css|assets)\/[^\"]+)\"/g, 'href=\"{{ get_asset_url(\\'' + dir + '/\$1\\') }}\"');

  // Add HubL template annotation header
  const header = '<!--\\n  templateType: page\\n  isAvailableForNewContent: true\\n  label: ' + label + '\\n-->\\n';

  // Add standard_header_includes after <head>
  html = html.replace('<head>', '<head>\\n    {{ standard_header_includes }}');

  // Add standard_footer_includes before </html>
  html = html.replace('</html>', '{{ standard_footer_includes }}\\n</html>');

  fs.writeFileSync(path.join(buildDir, file), header + html);
}
" "${FILES[@]}"

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
      hs cms upload "$dir" "$HUBSPOT_DIR/$dir" 2>&1 | tail -1
    fi
  done

  # Upload converted HTML templates
  echo "  Uploading templates..."
  for file in "${FILES[@]}"; do
    if [ -f "$BUILD_DIR/$file" ]; then
      hs cms upload "$BUILD_DIR/$file" "$HUBSPOT_DIR/$file" 2>&1 | tail -1
    fi
  done

  echo ""
  echo "Upload complete. Remember to publish/republish pages in HubSpot."
else
  echo "HubSpot CLI (hs) not found. To upload manually:"
  echo "  hs cms upload css $HUBSPOT_DIR/css"
  echo "  hs cms upload js $HUBSPOT_DIR/js"
  echo "  hs cms upload assets $HUBSPOT_DIR/assets"
  echo "  hs cms upload img $HUBSPOT_DIR/img"
  for file in "${FILES[@]}"; do
    echo "  hs cms upload $BUILD_DIR/$file $HUBSPOT_DIR/$file"
  done
fi

echo ""
echo "Done!"
