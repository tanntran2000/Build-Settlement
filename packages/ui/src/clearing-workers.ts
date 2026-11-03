function dispatchWorkers(type:string,raw:string,tileId:string,oncommand:(type:string,fields?:Record<string,unknown>)=>boolean,badInput=false):string {
 const input=raw.trim(),workers=Number(input);
 if(badInput||!/^\d+$/.test(input)||!Number.isSafeInteger(workers))return 'Use whole nonnegative workers.';
 oncommand(type,{tileId,workers});return '';
}
export function clearOutsideWorkers(raw:string,tileId:string,oncommand:(type:string,fields?:Record<string,unknown>)=>boolean,badInput=false):string {
 return dispatchWorkers('CLEAR',raw,tileId,oncommand,badInput);
}
export function workerDigits(raw:string):string {return raw.replace(/[^0-9]/g,'');}
export function assignBuildingWorkers(raw:string,tileId:string,oncommand:(type:string,fields?:Record<string,unknown>)=>boolean):string {
 return dispatchWorkers('SET_WORKERS',raw,tileId,oncommand);
}
