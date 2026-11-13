import subprocess,sys,datetime,pathlib
sys.stdout.reconfigure(encoding="utf-8")
folder=pathlib.Path(__file__).parent
name,cmd=sys.argv[1],sys.argv[2]
def git(*args): return subprocess.check_output(['git',*args],text=True).strip()
head,tree=git('rev-parse','HEAD'),git('rev-parse','HEAD^{tree}')
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
raw=folder/(name+'.running')
with raw.open('wb') as output:
 r=subprocess.run(['powershell','-NoProfile','-Command',cmd],stdout=output,stderr=subprocess.STDOUT)
text=raw.read_bytes().decode('utf-8',errors='replace')
header=f'HEAD: {head}\nTree: {tree}\nUTC: {start}\nExit: {r.returncode}\nCommand: {cmd}\n\n'
(folder/name).write_text(header+text,encoding='utf8')
raw.unlink()
print(header+text[-2000:])
sys.exit(r.returncode)
