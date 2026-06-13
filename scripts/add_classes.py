#!/usr/bin/env python3
import os
import re

# Definições de classes a adicionar por arquivo
fixes = {
    'html/lista-jogos.html': [
        (r'<div id="loading-overlay">', '<div id="loading-overlay" class="hidden">'),
    ],
    'html/mercado-negro.html': [
        (r'<div id="box-opening-modal" class="modal"(?!.*hidden)', '<div id="box-opening-modal" class="modal hidden"'),
    ],
    'html/busca.html': [
        # Busca já deve estar okay
    ],
    'html/admin.html': [
        # Admin já deve estar okay
    ],
}

base_path = "c:\\Users\\gabriel.fmomo\\Desktop\\Projeto Mega Site 1 (1)\\Projeto Mega Site"

for filepath, replacements in fixes.items():
    full_path = os.path.join(base_path, filepath)
    
    if not os.path.exists(full_path):
        print(f"✗ Arquivo não encontrado: {filepath}")
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    for pattern, replacement in replacements:
        if pattern:
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                modified = True
                print(f"✓ {filepath} - adicionada classe")
    
    if modified:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    print(f"✓ Processado: {filepath}")
