#!/usr/bin/env python3
import os
import glob

html_files = glob.glob(r"c:\Users\gabriel.fmomo\Desktop\Projeto Mega Site 1 (1)\Projeto Mega Site\html\*.html")

total_count = 0
for filepath in html_files:
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
            count = content.count('style=')
            if count > 0:
                print(f"  {os.path.basename(filepath)}: {count}")
            total_count += count
    except Exception as e:
        print(f"  Erro em {filepath}: {e}")

print(f"\n✓ Total de 'style=' encontrados: {total_count}")
