import json
from collections import Counter

with open('json/games.json', encoding='utf-8') as f:
    data = json.load(f)

ids = [item.get('id') for item in data]
print('entries:', len(data))
print('last id:', ids[-1] if ids else None)
print('unique ids:', len(set(ids)))

# check sequential
expected = list(range(1, len(data)+1))
if ids == expected:
    print('sequential: yes')
else:
    print('sequential: no')
    # show first mismatch
    for i, (a, b) in enumerate(zip(ids, expected), start=1):
        if a != b:
            print('first mismatch at index', i, 'id', a, 'expected', b)
            break

# duplicates
cnt = Counter(ids)
dups = [k for k, v in cnt.items() if v > 1]
print('duplicates found:', dups)
