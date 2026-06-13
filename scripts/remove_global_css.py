#!/usr/bin/env python3
import glob
import re
import os

html_files = glob.glob(r"c:\Users\gabriel.fmomo\Desktop\Projeto Mega Site 1 (1)\Projeto Mega Site\html\*.html")

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    # Remove a linha que importa style-global.css
    content = re.sub(r'.*<link rel="stylesheet" href=".*style-global\.css".*\n?', '', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'✓ {os.path.basename(filepath)}')
