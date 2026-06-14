#!/usr/bin/env python3
import os

# Corrigir perfil.html
filepath = "html/perfil.html"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

first_close = content.find('</html>')
if first_close > 0:
    fixed = content[:first_close + 7]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(fixed)
    print(f"✓ Duplicacao removida de perfil.html")
else:
    print(f"✓ perfil.html ja estava correto")

# Agora adicionar classes nas outras páginas
files_classes = {
    'html/perfil.html': [
        ('<button class="btn-edit-profile" id="btn-edit-profile">', '<button class="btn-edit-profile hidden" id="btn-edit-profile">'),
        ('<span class="profile-id" id="profile-friendship-id"', '<span class="profile-id cursor-pointer" id="profile-friendship-id"'),
        ('<button class="buy-button" id="btn-add-friend">', '<button class="buy-button hidden mt-5" id="btn-add-friend">'),
        ('<div id="login-modal" class="modal">', '<div id="login-modal" class="modal hidden">'),
        ('<div id="modal-signup-section">', '<div id="modal-signup-section" class="hidden">'),
        ('<div id="loading-overlay">', '<div id="loading-overlay" class="hidden">'),
    ],
}

for filepath, replacements in files_classes.items():
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for old, new in replacements:
            if old in content:
                content = content.replace(old, new)
                print(f"✓ Adicionada classe em {filepath}")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
