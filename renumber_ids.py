import json
import sys
import shutil

def main():
    if len(sys.argv) < 2:
        print("Uso: python renumber_ids.py <entrada.json> [saida.json]")
        sys.exit(1)
    infile = sys.argv[1]
    outfile = sys.argv[2] if len(sys.argv) > 2 else infile

    # backup
    try:
        shutil.copy(infile, infile + '.bak')
        print(f'Backup criado: {infile}.bak')
    except Exception as e:
        print(f'Não foi possível criar backup: {e}')

    with open(infile, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for i, obj in enumerate(data, start=1):
        obj['id'] = i

    with open(outfile, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f'Renumerado {len(data)} entradas e gravado em {outfile}')

if __name__ == '__main__':
    main()
