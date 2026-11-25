"""Keep Windows awake while a long local test process runs."""
import ctypes
import subprocess
import sys

win = ctypes.WinDLL('kernel32', use_last_error=True)
set_execution_state = win.SetThreadExecutionState
set_execution_state.argtypes = [ctypes.c_ulong]
set_execution_state.restype = ctypes.c_ulong
continuous = 0x80000000
system_required = 0x00000001
old = set_execution_state(continuous | system_required)
if not old:
    raise ctypes.WinError(ctypes.get_last_error())
try:
    print('Windows system sleep inhibited for this process while the child runs.', flush=True)
    code = subprocess.run(sys.argv[1:]).returncode
finally:
    set_execution_state(continuous)
    print('Process execution-state request released.', flush=True)
sys.exit(code)

