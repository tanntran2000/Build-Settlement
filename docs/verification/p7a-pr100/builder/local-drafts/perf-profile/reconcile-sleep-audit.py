"""Record late sleep/resume events honestly and check overlap with every measured process."""
from pathlib import Path
import datetime as dt
import json
import xml.etree.ElementTree as ET

OUT=Path(__file__).resolve().parent
load=lambda name:json.loads((OUT/name).read_text(encoding='utf-8-sig'))
stamp=lambda text:dt.datetime.fromisoformat(text.replace('Z','+00:00'))
sequence=load('sequence.json');sleep=load('sleep-resume-events.json')
ns={'e':'http://schemas.microsoft.com/win/2004/08/events/event'}
events=[];intervals=[]
for event in sleep['events']:
    xml=ET.fromstring(event['xml'])
    fields={item.attrib.get('Name'):item.text for item in xml.findall('.//e:EventData/e:Data',ns)}
    row={'utc':event['utc'],'id':event['id'],'provider':event['provider']}
    if fields.get('SleepTime') and fields.get('WakeTime'):
        row.update(sleepTime=fields['SleepTime'],wakeTime=fields['WakeTime'])
        intervals.append((stamp(row['sleepTime']),stamp(row['wakeTime'])))
    events.append(row)
overlap=[]
for run in sequence['runs']:
    start,end=stamp(run['utcStart']),stamp(run['utcEnd'])
    if any(start<=stamp(e['utc'])<=end for e in events) or any(start<=wake and end>=asleep for asleep,wake in intervals):overlap.append(run['run'])
assert overlap==[],overlap
last=max(stamp(r['utcEnd']) for r in sequence['runs'])
audit={'windowStartUtc':sleep['windowStartUtc'],'windowEndUtc':sleep['windowEndUtc'],'eventCount':sleep['eventCount'],'events':sorted(events,key=lambda e:e['utc']),'measurementRunOverlap':overlap,'allEventsAfterLastMeasurement':all(stamp(e['utc'])>last for e in events),'allSleepIntervalsAfterLastMeasurement':all(asleep>last for asleep,wake in intervals),'lastMeasurementEndUtc':last.isoformat()}
(OUT/'sleep-audit-summary.json').write_text(json.dumps(audit,indent=2)+'\n',encoding='utf-8')
summary=load('summary.json');summary['environmentAudit']=audit
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
note='''
## Extended sleep/resume audit

The final extended window records **3 events**, all after every measured process ended. The six runs ended at 2026-11-17 23:05:11.969985 UTC. Power-Troubleshooter records sleep beginning at 23:10:38.7282707 UTC and waking at 2026-11-18 00:31:30.3498965 UTC. Kernel-Power events 42/107 and the later Power-Troubleshooter event are retained. No event or reported sleep interval overlaps a measurement run. The earlier shorter restoration audit had zero events; the extended audit supersedes its count. See sleep-audit-summary.json and raw sleep-resume-events.json.
'''
readme=(OUT/'README.md').read_text(encoding='utf-8')
if '## Extended sleep/resume audit' not in readme:(OUT/'README.md').write_text(readme+note,encoding='utf-8')
parent=OUT.parent
readme=(parent/'README.md').read_text(encoding='utf-8')
readme=readme.replace('Explicit UTC sleep/resume audit reports zero events through restoration.','The extended UTC sleep/resume audit records 3 events after all six measurements ended, with zero overlap of any measurement run; see perf-profile/sleep-audit-summary.json.')
(parent/'README.md').write_text(readme,encoding='utf-8')
summary=json.loads((parent/'results-summary.json').read_text(encoding='utf-8'));summary['diagnosticEnvironmentAudit']=audit
(parent/'results-summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps(audit,indent=2))
