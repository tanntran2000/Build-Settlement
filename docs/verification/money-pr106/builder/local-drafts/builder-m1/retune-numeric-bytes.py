
from pathlib import Path
import sys,re,json,hashlib,subprocess
session=Path(r'C:\Users\Admin\.t3\local-drafts\money-prM1')
builder=session/'builder-m1'
scratch=(session/'_scratch/tree').resolve()
commit='63d2b2627b57d172be8459c64989e42ff650f692'
files={
 'packages/core/src/data/tuning.json',
 'packages/core/src/data/buildings.json',
 'packages/core/src/data/npc-generator.json',
}
def sha(b):return hashlib.sha256(b).hexdigest()
def editNumbers(raw,changes):
    text=raw.decode('utf8')
    decoder=json.JSONDecoder()
    spans={}
    def space(i):
        while i<len(text) and text[i].isspace():i+=1
        return i
    def scan(i, path):
        i=space(i)
        if text[i]=='{':
            j=space(i+1)
            while text[j]!='}':
                key,j=decoder.raw_decode(text,j)
                j=space(j);assert text[j]==':'
                j=space(scan(j+1,path+(key,)))
                if text[j]=='}':break
                assert text[j]==','
                j=space(j+1)
            return j+1
        value,end=decoder.raw_decode(text,i)
        spans[path]=(i,end,value)
        return end
    assert space(scan(0,()))==len(text)
    edits=[];records=[]
    for p,n in changes.items():
        i,j,v=spans[tuple(p.split('.'))]
        assert type(n)==type(v)==int and n>=0,(p,n,v)
        if n==v:continue
        edits.append((i,j,str(n)))
        records.append({'field':p,'line':text.count('\n',0,i)+1,'before':v,'after':n})
    for i,j,v in sorted(edits,reverse=True):text=text[:i]+v+text[j:]
    return text.encode('utf8'),records
def main():
    from base64 import b64encode
    round_name=sys.argv[1]
    assert round_name in ('round1','round2')
    cwd=Path.cwd()
    assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==commit
    configs=json.loads((builder/f'{round_name}-input.json').read_bytes())
    assert set(configs)<=files
    data=[]
    for name in sorted(files):
        src=(cwd/name).read_bytes()
        base=subprocess.check_output(['git','show',commit+':'+name])
        assert src.replace(b'\r\n',b'\n')==base, name
        patch,records=editNumbers(src,configs.get(name,{}))
        target=scratch/name
        assert target.resolve().is_relative_to(scratch),name
        target.write_bytes(patch)
        if records:
            data.append({'path':name,'m1.1Commit':commit,'beforeSha256':sha(src),'afterSha256':sha(patch),
                'beforeUtf8Base64':b64encode(src).decode(),'afterUtf8Base64':b64encode(patch).decode(),
                'changes':records})
    (builder/f'{round_name}-data-bytes.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf8',newline='\n')
    for f in data:print(f['path'],f['afterSha256'],len(f['changes']))
if __name__=='__main__':main()
