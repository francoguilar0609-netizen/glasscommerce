import{constantTimeEqual}from"./security";
function hex(bytes:ArrayBuffer){return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,"0")).join("")}
export async function verifyMercadoPagoSignature(request:Request,dataId:string,secret:string){
 const signature=request.headers.get("x-signature")||"",requestId=request.headers.get("x-request-id")||"";
 const parts=Object.fromEntries(signature.split(",").map(v=>v.trim().split("=",2)));if(!parts.ts||!parts.v1||!requestId)return false;
 const age=Math.abs(Date.now()-Number(parts.ts)*1000);if(!Number.isFinite(age)||age>5*60*1000)return false;
 const manifest=`id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return constantTimeEqual(hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(manifest))),parts.v1.toLowerCase());
}
