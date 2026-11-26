from pathlib import Path
import re
b=Path(__file__).resolve().parent
audit=b/'m1.4-c7-utf8-audit.txt'
roots={'M1.4-C6.md','M1.4-C7.md','README.md','seal-m1.4-c6.py'}
known=('\u201cfulfillment states match strip and report.\u201d','\u00b7')
for name in ('M1.4-C6.md','seal-m1.4-c6.py'):
 text=(b/name).read_text(encoding='utf-8')
 assert all(x in text for x in known)
 assert '?fulfillment states match strip and report.?' not in text
 assert re.search(r'(?:\) \u00b7 \[Timeout context\]|\+\x27 \u00b7 \x27\+link\(.+Timeout context)',text),name
new=b/'M1.4-C7.md'
if new.exists():
 text=new.read_text(encoding='utf-8')
 for quote in ('S\u1eeda lu\u00f4n trong M1','Ch\u1ea5p nh\u1eadn (Recommended)','T\u00e2n'):
  assert quote in text,quote
summary=[]
contexts=[]
for p in sorted(b.rglob('*')):
 if not p.is_file() or p==audit:continue
 rel=p.relative_to(b).as_posix()
 if p.name not in roots and 'm1.4-c7' not in rel and 'c7' not in p.name:continue
 if p.suffix.lower() not in {'.txt','.py','.ps1','.md','.patch','.json','.mjs','.html','.csv'}:
  summary.append(f'{rel} binary artifact')
  continue
 text=p.read_bytes().decode('utf-8-sig')
 assert '\ufffd' not in text,rel
 summary.append(f'{rel} strict UTF-8, {text.count("?")} question marks')
 for n,line in enumerate(text.splitlines(),1):
  if '?' not in line:continue
  if p.suffix=='.md' and p.name in roots:
   assert not re.search(r'\]\([^\n]*\)\s+\?\s+\[|\?[a-z][^?]{10,80}\.\?',line), (rel,n,line)
  contexts.append(f'{rel}:{n} {line[:430]}')
audit.write_text('Strict UTF-8 audit. Restored curly quotation marks and middle-dot separator in both C6 files.\n'
 +'\n'.join(summary)+'\n\nQuestion-mark contexts for inspection\n'+'\n'.join(contexts)+'\n',
 encoding='utf-8',newline='\n')
print('UTF-8 audit paths',len(summary))
