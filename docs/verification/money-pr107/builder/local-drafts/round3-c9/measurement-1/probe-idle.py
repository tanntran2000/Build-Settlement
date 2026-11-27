import ctypes,json,statistics,time
from ctypes import wintypes
from datetime import datetime,timezone

system_times=ctypes.WinDLL('kernel32',use_last_error=True).GetSystemTimes
system_times.argtypes=[ctypes.POINTER(wintypes.FILETIME)]*3
system_times.restype=wintypes.BOOL

def counts():
 idle,kernel,user=(wintypes.FILETIME() for _ in range(3))
 if not system_times(ctypes.byref(idle),ctypes.byref(kernel),ctypes.byref(user)):
  raise ctypes.WinError(ctypes.get_last_error())
 return tuple((x.dwHighDateTime << 32) | x.dwLowDateTime for x in (idle,kernel,user))

samples=[]
prior=counts()
for _ in range(3):
 time.sleep(2)
 current=counts()
 idle,kernel,user=(n-p for n,p in zip(current,prior))
 samples.append(round(100*(1-idle/(kernel+user)),2))
 prior=current
print(json.dumps({'utc':datetime.now(timezone.utc).isoformat(),'twoSecondCpuPercent':samples,
                  'meanCpuPercent':round(statistics.mean(samples),2)}))
