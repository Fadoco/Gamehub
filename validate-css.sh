#!/bin/bash
# GameHub CSS Resolution Validation Script
# Run this to verify all files exist and are correctly structured

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      GameHub CSS Resolution - File Validation Script          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
TOTAL=0
PASSED=0

# Function to check file
check_file() {
    local file=$1
    local description=$2
    TOTAL=$((TOTAL + 1))
    
    if [ -f "$file" ]; then
        local size=$(wc -c < "$file")
        local lines=$(wc -l < "$file")
        echo -e "${GREEN}✓${NC} $description"
        echo "  Path: $file"
        echo "  Size: $size bytes | Lines: $lines"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $description"
        echo "  Path: $file"
        echo "  Status: NOT FOUND"
    fi
    echo ""
}

echo "═══════════════════════════════════════════════════════════════"
echo "Checking CSS Files (NEW)..."
echo "═══════════════════════════════════════════════════════════════"
check_file "css/header-footer.css" "Header & Footer CSS"
check_file "css/admin.css" "Admin Panel CSS"
check_file "css/upgrades.css" "Upgrades System CSS"
check_file "css/welcome.css" "Welcome Page CSS"
check_file "css/carrinho.css" "Shopping Cart CSS"
check_file "css/perfil.css" "User Profile CSS"
check_file "css/biblioteca.css" "Game Library CSS"
check_file "css/historico.css" "Transaction History CSS"
check_file "css/busca.css" "Search Page CSS"

echo "═══════════════════════════════════════════════════════════════"
echo "Checking CSS Files (EXISTING)..."
echo "═══════════════════════════════════════════════════════════════"
check_file "css/variables.css" "CSS Variables"
check_file "css/reset.css" "CSS Reset"
check_file "css/style-global.css" "Global Styles"
check_file "css/layout.css" "Layout Styles"
check_file "css/components.css" "Component Styles"
check_file "css/animations.css" "Basic Animations"
check_file "css/utilities.css" "Utility Classes"
check_file "css/responsive.css" "Responsive Design"
check_file "css/theme-switcher.css" "Theme Switcher"
check_file "css/animations-enhanced.css" "Enhanced Animations"
check_file "css/home.css" "Home Page Styles"
check_file "css/login.css" "Login Page Styles"
check_file "css/jogo.css" "Game Page Styles"
check_file "css/ranking.css" "Ranking Page Styles"
check_file "css/mercado-negro.css" "Black Market Styles"
check_file "css/mercado-negro-enhanced.css" "Black Market Enhanced"

echo "═══════════════════════════════════════════════════════════════"
echo "Checking JavaScript Files..."
echo "═══════════════════════════════════════════════════════════════"
check_file "java/firebase-config.js" "Firebase Configuration (NEW)"
check_file "java/global.js" "Global JavaScript"
check_file "java/auth.js" "Authentication"
check_file "java/animation-enhancements.js" "Animation Enhancements"
check_file "java/firestore-cache.js" "Firestore Cache"
check_file "java/theme-switcher.js" "Theme Switcher"
check_file "java/lazy-image-loader.js" "Lazy Image Loader"
check_file "java/pwa-manager.js" "PWA Manager"

echo "═══════════════════════════════════════════════════════════════"
echo "Checking HTML Files..."
echo "═══════════════════════════════════════════════════════════════"
check_file "index.html" "Home Page (Root)"
check_file "html/admin.html" "Admin Page"
check_file "html/welcome.html" "Welcome Page"
check_file "html/login.html" "Login Page"
check_file "html/carrinho.html" "Cart Page"
check_file "html/perfil.html" "Profile Page"
check_file "html/biblioteca.html" "Library Page"
check_file "html/historico.html" "History Page"
check_file "html/busca.html" "Search Page"

echo "═══════════════════════════════════════════════════════════════"
echo "VALIDATION SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo -e "Total Files Checked: $TOTAL"
echo -e "Files Found: ${GREEN}$PASSED${NC}"
echo -e "Files Missing: ${RED}$((TOTAL - PASSED))${NC}"
echo ""

if [ $PASSED -eq $TOTAL ]; then
    echo -e "${GREEN}✓ ALL FILES PRESENT - CSS RESOLUTION SUCCESSFUL!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some files are missing. Check the list above.${NC}"
    exit 1
fi
