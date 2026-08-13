"use client";

import { useEffect, useMemo, useState } from "react";

type Product = { id:number; name:string; category:string; price_pen:number; stock:number; emoji:string; description:string };
type Cart = Record<number, number>;

const accents=["violet","amber","cyan","pink","blue","green"];

export default function Home() {
  const [query,setQuery]=useState(""); const [category,setCategory]=useState("All");
  const [products,setProducts]=useState<Product[]>([]); const [currency,setCurrency]=useState<"PEN"|"USD">("PEN"); const [rate,setRate]=useState(3.75);
  const [cart,setCart]=useState<Cart>({}); const [cartOpen,setCartOpen]=useState(false);
  const [storageReady,setStorageReady]=useState(false);
  const [notice,setNotice]=useState(""); const [checkingOut,setCheckingOut]=useState(false);
  useEffect(()=>{fetch("/api/products").then(r=>r.json()).then(data=>{setProducts(data.products||[]);setRate(data.usdPenRate||3.75)}).catch(()=>setNotice("No se pudo cargar el catálogo."))},[]);
  useEffect(()=>{ const saved=window.localStorage.getItem("glasscommerce-cart"); const timer=window.setTimeout(()=>{ if(saved) setCart(JSON.parse(saved)); setStorageReady(true) },0); return()=>window.clearTimeout(timer) },[]);
  useEffect(()=>{ if(storageReady) window.localStorage.setItem("glasscommerce-cart",JSON.stringify(cart)); },[cart,storageReady]);
  const categories=["All",...new Set(products.map(p=>p.category))];
  const filtered=useMemo(()=>products.filter(p=>(category==="All"||p.category===category)&&`${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())),[category,query,products]);
  const entries=products.filter(p=>cart[p.id]).map(p=>({...p,quantity:cart[p.id]}));
  const itemCount=entries.reduce((sum,item)=>sum+item.quantity,0); const subtotalPen=entries.reduce((sum,item)=>sum+item.price_pen*item.quantity,0);
  const money=(cents:number)=>new Intl.NumberFormat(currency==="PEN"?"es-PE":"en-US",{style:"currency",currency}).format(currency==="PEN"?cents/100:cents/100/rate);
  function updateCart(id:number,change:number){setCart(current=>{const next=Math.max(0,(current[id]??0)+change);const updated={...current,[id]:next};if(!next)delete updated[id];return updated})}
  async function placeOrder(){if(!itemCount||checkingOut)return;setCheckingOut(true);const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:entries.map(i=>({productId:i.id,quantity:i.quantity}))})});const data=await response.json();setCheckingOut(false);if(response.status===401){window.location.assign("/signin-with-chatgpt?return_to=/");return}if(data.checkoutUrl){window.location.assign(data.checkoutUrl);return}setNotice(data.error||"No se pudo iniciar el pago.")}

  return <main>
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="site-header glass">
      <a className="brand" href="#top" aria-label="GlassCommerce home"><span>G</span>GlassCommerce</a>
      <nav aria-label="Navegación"><a href="#catalog">Tienda</a><a href="/orders">Mis pedidos</a><a href="/admin">Administración</a></nav>
      <button className="currency" onClick={()=>setCurrency(c=>c==="PEN"?"USD":"PEN")}>{currency}</button>
      <button className="cart-button" onClick={()=>setCartOpen(true)} aria-label={`Open cart with ${itemCount} items`}>Bag <strong>{itemCount}</strong></button>
    </header>
    {notice&&<div className="notice" role="status">✓ {notice}<button onClick={()=>setNotice("")} aria-label="Dismiss notification">×</button></div>}
    <>
      <section className="hero" id="top"><div className="eyebrow">OPEN-SOURCE COMMERCE STARTER</div><h1>Everyday objects,<br/><em>beautifully considered.</em></h1><p>A functional storefront MVP with local cart state, product discovery and a safe simulated checkout.</p><a className="primary" href="#catalog">Explore collection <span>→</span></a><div className="hero-card glass" aria-hidden="true"><div className="orb">⌚</div><span>ORBIT / 05</span><strong>Designed for motion.</strong></div></section>
      <section className="trust-row" aria-label="Beneficios"><span>◇ Código abierto</span><span>◎ Acceso con ChatGPT</span><span>↻ Pedidos persistentes</span><span>♢ Pago seguro con Mercado Pago</span></section>
      <section className="catalog" id="catalog"><div className="section-heading"><div><span className="eyebrow">CURATED ESSENTIALS</span><h2>Featured collection</h2></div><label className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products"/></label></div>
        <div className="filters" aria-label="Product categories">{categories.map(item=><button key={item} className={category===item?"selected":""} onClick={()=>setCategory(item)}>{item}</button>)}</div>
        <div className="product-grid">{filtered.map((p,index)=><article className="product-card glass" key={p.id}><div className={`product-visual ${accents[index%accents.length]}`}><span>{p.emoji}</span><small>{p.stock} disponibles</small></div><div className="product-copy"><span>{p.category}</span><h3>{p.name}</h3><p>{p.description}</p></div><div className="product-footer"><strong>{money(p.price_pen)}</strong><button disabled={!p.stock} onClick={()=>{updateCart(p.id,1);setNotice(`${p.name} agregado.`)}}>Agregar</button></div></article>)}</div>
        {!filtered.length&&<p className="empty">No products match that search.</p>}
      </section>
    </>
    {cartOpen&&<div className="drawer-backdrop" onMouseDown={()=>setCartOpen(false)}><aside className="cart-drawer" onMouseDown={e=>e.stopPropagation()} aria-label="Carrito"><div className="drawer-title"><div><span className="eyebrow">TU SELECCIÓN</span><h2>Carrito</h2></div><button onClick={()=>setCartOpen(false)}>×</button></div>{!entries.length?<div className="cart-empty"><span>◇</span><h3>Tu carrito está vacío</h3></div>:entries.map((item,index)=><div className="cart-item" key={item.id}><span className={`mini ${accents[index%accents.length]}`}>{item.emoji}</span><div><strong>{item.name}</strong><small>{money(item.price_pen)}</small></div><div className="quantity"><button onClick={()=>updateCart(item.id,-1)}>−</button><span>{item.quantity}</span><button onClick={()=>updateCart(item.id,1)}>+</button></div></div>)}<div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotalPen)}</strong></div><p>El cobro se procesa en PEN mediante Mercado Pago. USD es una conversión informativa.</p><button disabled={!itemCount||checkingOut} onClick={placeOrder}>{checkingOut?"Preparando pago…":"Pagar con Mercado Pago"}</button></div></aside></div>}
    <footer><a className="brand" href="#top"><span>G</span>GlassCommerce</a><p>Open-source commerce, thoughtfully built.</p><a href="https://github.com/francoguilar0609-netizen/glasscommerce">GitHub ↗</a></footer>
  </main>
}
