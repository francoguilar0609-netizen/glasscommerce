export function parseCookies(request: Request): Record<string,string> {
  return Object.fromEntries((request.headers.get("cookie") || "").split(";").map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf("=");return [decodeURIComponent(i<0?v:v.slice(0,i)),decodeURIComponent(i<0?"":v.slice(i+1))]}));
}
export function assertSameOrigin(request: Request) {
  const origin=request.headers.get("origin");
  if(origin && origin!==new URL(request.url).origin) throw new Response("Origen no permitido",{status:403});
}
export function constantTimeEqual(a:string,b:string){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
export function bytesToBase64(bytes:Uint8Array){let value="";for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value)}
export function base64ToBytes(value:string){return Uint8Array.from(atob(value),c=>c.charCodeAt(0))}
export async function sha256(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return bytesToBase64(new Uint8Array(digest))}
export function randomToken(bytes=32){const value=new Uint8Array(bytes);crypto.getRandomValues(value);return bytesToBase64(value).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}
