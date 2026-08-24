function hex(bytes){return[...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,"0")).join("")}
function equal(a,b){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
export function proxyManifest(email,timestamp,method,path){return `email:${email};ts:${timestamp};method:${method.toUpperCase()};path:${path};`}
export async function proxySignature(email,timestamp,method,path,secret){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(proxyManifest(email,timestamp,method,path))))}
export async function validateProxySignature({email,timestamp,method,path,signature,secret,now=Date.now()}){if(!/^[0-9a-fA-F]{64}$/.test(secret)||!/^\d{13}$/.test(timestamp)||!/^[0-9a-fA-F]{64}$/.test(signature))return false;const signedAt=Number(timestamp);if(!Number.isSafeInteger(signedAt)||Math.abs(now-signedAt)>60000)return false;return equal(await proxySignature(email,timestamp,method,path,secret),signature.toLowerCase())}

