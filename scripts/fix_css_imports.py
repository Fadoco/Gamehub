from pathlib import Path
import re

workspace = Path('.').resolve()
html_files = list((workspace / 'html').glob('*.html')) + [workspace / 'index.html'] + [workspace / 'Roleta' / 'roleta.html']

for path in html_files:
    text = path.read_text(encoding='utf-8', errors='ignore')
    if 'style-global.css' in text:
        continue

    if 'css/variables.css' in text:
        marker = '    <link rel="stylesheet" href="css/variables.css">\n'
        if path.name == 'roleta.html':
            marker = '    <link rel="stylesheet" href="../css/variables.css">\n'
        insert_after = '    <link rel="stylesheet" href="css/reset.css">\n'
        if path.name == 'roleta.html':
            insert_after = '    <link rel="stylesheet" href="../css/reset.css">\n'

        if path.parent.name == 'html':
            style_global = '    <link rel="stylesheet" href="../css/style-global.css">\n'
        else:
            style_global = '    <link rel="stylesheet" href="css/style-global.css">\n'

        text = text.replace(insert_after, insert_after + style_global, 1)
        path.write_text(text, encoding='utf-8')
        print('UPDATED', path)

print('DONE')
