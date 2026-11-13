import subprocess,sys,pathlib
p=pathlib.Path(__file__).parent
cmd="& 'C:/Program Files/Git/bin/bash.exe' 'C:/Users/Admin/.t3/local-drafts/data01-prC/fix1/smoke.sh'"
sys.exit(subprocess.run([sys.executable,str(p/'run.py'),'smoke.txt',cmd]).returncode)
