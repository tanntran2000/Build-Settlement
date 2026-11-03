export function clearOutsideWorkers(raw:string,tileId:string,oncommand:(type:string,fields?:Record<string,unknown>)=>boolean,badInput=false):string {
 const input=raw.trim(),workers=Number(input);
 if(badInput||!/^\d+$/.test(input)||!Number.isSafeInteger(workers))return 'Use whole nonnegative workers.';
 oncommand('CLEAR',{tileId,workers});return '';
}
