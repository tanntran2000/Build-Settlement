import re
import subprocess
import sys

base = '95821832a8c95988c3203b4c38f5f9ae665978e9'
head = subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()
paths = subprocess.check_output(['git','diff','--name-only','-z',base,head]).decode().strip('\0').split('\0')
signature = re.compile(rb'-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----'
    rb'|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}'
    rb'|sk-(?:proj-|svcacct-)[A-Za-z0-9_-]{30,}|xox[baprs]-[A-Za-z0-9-]{20,}')
changed = subprocess.check_output(['git','diff','--no-ext-diff','--unified=0',base,head])
additions = [row[1:] for row in changed.splitlines() if row.startswith(b'+') and not row.startswith(b'+++ ')]
assert len(paths) == 26
assert not signature.search(b'\n'.join(additions)), 'A credential-shaped addition requires review.'
assert not subprocess.check_output(['git','status','--porcelain=v1'])
print(f'{len(paths)} approved paths. {len(additions)} added lines. No matches for the credential signatures scanned.')
print('HEAD '+head)

