export function clearOutsideWorkers(raw:string,tileId:string,oncommand:(type:string,fields?:Record<string,unknown>)=>boolean):string {
 const input=raw.trim(),workers=Number(input);
 if(!/^\d+$/.test(input)||!Number.isSafeInteger(workers))return 'Use whole nonnegative workers.';
 oncommand('CLEAR',{tileId,workers});return '';
}
