import { runtimeEnv } from "./store";
import { assertSameOrigin,base64ToBytes,bytesToBase64,constantTimeEqual,parseCookies,randomToken,sha256 } from "./security";

export type AuthUser={id:string;email:string;role:"customer"|"admin";source:"session"|"trusted-proxy"};
const COOKIE="gc_session", ITERATIONS=310000, SESSION_DAYS=30;

export async function hashPassword(password:string){
  if(password.length<12||password.length>128)throw new Response("La contraseña debe tener entre 12 y 128 caracteres.",{status:400});
  const salt=new Uint8Array(16);crypto.getRandomValues(salt);
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:ITERATIONS},key,256);
  return `pbkdf2_sha256$${ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`;
}
export async function verifyPassword(password:string,encoded:string){
  const [kind,iterations,salt,expected]=encoded.split("$");if(kind!=="pbkdf2_sha256"||!iterations||!salt||!expected)return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:base64ToBytes(salt),iterations:Number(iterations)},key,256);
  return constantTimeEqual(bytesToBase64(new Uint8Array(bits)),expected);
}
function normalizeEmail(value:string){const email=value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new Response("Correo inválido.",{status:400});return email}
function cookie(token:string,request:Request,maxAge:number){const secure=new URL(request.url).protocol==="https:"?"; Secure":"";return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`}
export async function createAccount(request:Request,emailValue:string,password:string){
  assertSameOrigin(request);const env=runtimeEnv();if(env.ALLOW_LOCAL_REGISTRATION!=="true")throw new Response("El registro local está desactivado.",{status:403});const email=normalizeEmail(emailValue);
  const blocked=(env.ADMIN_EMAILS||"").toLowerCase().split(",").map(v=>v.trim()).includes(email);
  if(blocked)throw new Response("Ese correo requiere acceso mediante el proveedor verificado.",{status:403});
  const passwordHash=await hashPassword(password),id=crypto.randomUUID(),now=new Date().toISOString();
  try{await env.DB.prepare("INSERT INTO users(id,email,password_hash,role,created_at,updated_at) VALUES(?,?,?,?,?,?)").bind(id,email,passwordHash,"customer",now,now).run()}
  catch{throw new Response("La cuenta ya existe.",{status:409})}
  return createSession(request,{id,email,role:"customer",source:"session"});
}
export async function login(request:Request,emailValue:string,password:string){
  assertSameOrigin(request);const email=normalizeEmail(emailValue),env=runtimeEnv();const ip=request.headers.get("cf-connecting-ip")||request.headers.get("x-forwarded-for")?.split(",")[0].trim()||"unknown";const attemptKey=await sha256(ip+"|"+email),now=new Date(),resetAt=new Date(now.getTime()+15*60*1000).toISOString();
  await env.DB.prepare("INSERT INTO auth_attempts(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<=? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END").bind(attemptKey,resetAt,now.toISOString(),now.toISOString()).run();
  const attempts=await env.DB.prepare("SELECT count FROM auth_attempts WHERE key=?").bind(attemptKey).first<{count:number}>();if((attempts?.count||0)>5)throw new Response("Demasiados intentos. Prueba más tarde.",{status:429,headers:{"Retry-After":"900"}});
  const row=await env.DB.prepare("SELECT id,email,password_hash,role FROM users WHERE email=?").bind(email).first<{id:string;email:string;password_hash:string|null;role:"customer"|"admin"}>();
  if(!row?.password_hash||!(await verifyPassword(password,row.password_hash)))throw new Response("Credenciales inválidas.",{status:401});
  await env.DB.prepare("DELETE FROM auth_attempts WHERE key=?").bind(attemptKey).run();return createSession(request,{id:row.id,email:row.email,role:row.role,source:"session"});
}
async function createSession(request:Request,user:AuthUser){
  const token=randomToken(),tokenHash=await sha256(token),now=new Date(),expires=new Date(now.getTime()+SESSION_DAYS*86400000);
  await runtimeEnv().DB.prepare("INSERT INTO sessions(id,user_id,token_hash,expires_at,created_at,last_seen_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),user.id,tokenHash,expires.toISOString(),now.toISOString(),now.toISOString()).run();
  return {user,setCookie:cookie(token,request,SESSION_DAYS*86400)};
}
export async function logout(request:Request){assertSameOrigin(request);const token=parseCookies(request)[COOKIE];if(token)await runtimeEnv().DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256(token)).run();return cookie("",request,0)}
export async function authenticate(request:Request):Promise<AuthUser|null>{
  const env=runtimeEnv(),token=parseCookies(request)[COOKIE];
  if(token){const row=await env.DB.prepare("SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?").bind(await sha256(token),new Date().toISOString()).first<{id:string;email:string;role:"customer"|"admin"}>();if(row)return {...row,source:"session"}}
  if(env.TRUST_PROXY_AUTH_HEADERS==="true"){const email=request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();if(email){const admins=(env.ADMIN_EMAILS||"").toLowerCase().split(",").map(v=>v.trim());return {id:`proxy:${email}`,email,role:admins.includes(email)?"admin":"customer",source:"trusted-proxy"}}}
  return null;
}
export async function requireUser(request:Request){const user=await authenticate(request);if(!user)throw new Response("No autenticado",{status:401});return user}
export async function requireAdmin(request:Request){const user=await requireUser(request);if(user.role!=="admin")throw new Response("No autorizado",{status:403});return user}
