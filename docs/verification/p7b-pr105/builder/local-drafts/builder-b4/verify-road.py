from pathlib import Path
import csv
import json
import sys

road_file = Path(sys.argv[1])
sections = {}
road = None
for line in road_file.read_text(encoding='utf-8').splitlines():
    if line.startswith('[') and line.endswith(']'):
        road = line[1:-1]
        assert road not in sections
        sections[road] = {'rows':[]}
    elif road is not None:
        if line and line[0].isdigit():
            sections[road]['rows'].append([int(x) for x in next(csv.reader([line]))])
        elif line.startswith('summary,'):
            sections[road]['summary'] = dict(entry.split('=',1) for entry in line.split(',')[1:])
expected = ['build-first','slave-first','servant-first']
print(json.dumps({road:{'rows':len(section['rows']),'summary':section.get('summary')}
    for road,section in sections.items()}, indent=2))
assert list(sections.keys()) == expected
for road, item in sections.items():
    assert [row[0] for row in item['rows']] == list(range(1,41)), road
    assert all(len(row) == 10 for row in item['rows']), road
    assert item['summary']['close'] == '40', road
print('All three roads produced contiguous weeks 1–40.')

