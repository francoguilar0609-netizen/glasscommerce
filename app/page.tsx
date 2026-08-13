"use client";

import { useEffect, useMemo, useState } from "react";

type Product = { id:number; name:string; category:string; price:number; stock:number; emoji:string; accent:string; description:string };
type Cart = Record<number, number>;

const products: Product[] = [
  { id:1, name:"Aurora Headphones", category:"Audio", price:129, stock:18, emoji:"🎧", accent:"violet", description:"Spatial sound, 40-hour battery and adaptive noise control." },
  { id:2, name:"Halo Desk Light", category:"Workspace", price:79, stock:12, emoji:"💡", accent:"amber", description:"Warm-to-cool lighting with touch controls and USB-C power." },
  { id:3, name:"Drift Keyboard", category:"Workspace", price:109, stock:8, emoji:"⌨️", accent:"cyan", description:"Low-profile mechanical keys in a compact wireless frame." },
  { id:4, name:"Nova Speaker", category:"Audio", price:149, stock:6, emoji:"🔊", accent:"pink", description:"Room-filling stereo sound with a durable, portable body." },
  { id:5, name:"Orbit Watch", category:"Wearables", price:189, stock:14, emoji:"⌚", accent:"blue", description:"Health insights, five-day battery and an always-on display." },
  { id:6, name:"Prism Bottle", category:"Lifestyle", price:39, stock:24, emoji:"💧", accent:"green", description:"Vacuum-insulated steel that keeps drinks cold for 24 hours." },
];
const money = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" });

export default function Home() {
  const [query,setQuery]=useState(""); const [category,setCategory]=useState("All");
  const [cart,setCart]=useState<Cart>({}); const [cartOpen,setCartOpen]=useState(false);
  const [storageReady,setStorageReady]=useState(false);
  const [view,setView]=useState<"shop"|"admin">("shop"); const [notice,setNotice]=useState(""); const [orderId,setOrderId]=useState("");
  useEffect(()=>{ const saved=window.localStorage.getItem("glasscommerce-cart"); const timer=window.setTimeout(()=>{ if(saved) setCart(JSON.parse(saved)); setStorageReady(true) },0); return()=>window.clearTimeout(timer) },[]);
  useEffect(()=>{ if(storageReady) window.localStorage.setItem("glasscommerce-cart",JSON.stringify(cart)); },[cart,storageReady]);
  const categories=["All",...new Set(products.map(p=>p.category))];
  const filtered=useMemo(()=>products.filter(p=>(category==="All"||p.category===category)&&`${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())),[category,query]);
  const entries=products.filter(p=>cart[p.id]).map(p=>({...p,quantity:cart[p.id]}));
  const itemCount=entries.reduce((sum,item)=>sum+item.quantity,0); const subtotal=entries.reduce((sum,item)=>sum+item.price*item.quantity,0);
  function updateCart(id:number,change:number){setCart(current=>{const next=Math.max(0,(current[id]??0)+change);const updated={...current,[id]:next};if(!next)delete updated[id];return updated})}
  function placeOrder(){if(!itemCount)return;const id=`GC-${String(Date.now()).slice(-6)}`;setOrderId(id);setCart({});setCartOpen(false);setNotice(`Demo order ${id} created. No payment was processed.`)}

  return <main>
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="site-header glass">
      <a className="brand" href="#top" aria-label="GlassCommerce home"><span>G</span>GlassCommerce</a>
      <nav aria-label="Main navigation"><button className={view==="shop"?"active":""} onClick={()=>setView("shop")}>Shop</button><button className={view==="admin"?"active":""} onClick={()=>setView("admin")}>Admin demo</button></nav>
      <button className="cart-button" onClick={()=>setCartOpen(true)} aria-label={`Open cart with ${itemCount} items`}>Bag <strong>{itemCount}</strong></button>
    </header>
    {notice&&<div className="notice" role="status">✓ {notice}<button onClick={()=>setNotice("")} aria-label="Dismiss notification">×</button></div>}
    {view==="shop"?<>
      <section className="hero" id="top"><div className="eyebrow">OPEN-SOURCE COMMERCE STARTER</div><h1>Everyday objects,<br/><em>beautifully considered.</em></h1><p>A functional storefront MVP with local cart state, product discovery and a safe simulated checkout.</p><a className="primary" href="#catalog">Explore collection <span>→</span></a><div className="hero-card glass" aria-hidden="true"><div className="orb">⌚</div><span>ORBIT / 05</span><strong>Designed for motion.</strong></div></section>
      <section className="trust-row" aria-label="Store benefits"><span>◇ Open-source</span><span>◎ Accessible UI</span><span>↻ Local cart persistence</span><span>♢ Simulated checkout</span></section>
      <section className="catalog" id="catalog"><div className="section-heading"><div><span className="eyebrow">CURATED ESSENTIALS</span><h2>Featured collection</h2></div><label className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products"/></label></div>
        <div className="filters" aria-label="Product categories">{categories.map(item=><button key={item} className={category===item?"selected":""} onClick={()=>setCategory(item)}>{item}</button>)}</div>
        <div className="product-grid">{filtered.map(p=><article className="product-card glass" key={p.id}><div className={`product-visual ${p.accent}`}><span>{p.emoji}</span><small>{p.stock} in stock</small></div><div className="product-copy"><span>{p.category}</span><h3>{p.name}</h3><p>{p.description}</p></div><div className="product-footer"><strong>{money.format(p.price)}</strong><button onClick={()=>{updateCart(p.id,1);setNotice(`${p.name} added to your bag.`)}}>Add to bag</button></div></article>)}</div>
        {!filtered.length&&<p className="empty">No products match that search.</p>}
      </section>
    </>:<section className="admin-page"><div className="eyebrow">ADMINISTRATION / DEMO DATA</div><h1>Store overview</h1><p className="admin-intro">A read-only dashboard showing the intended administration experience. Authentication and server persistence are not implemented in this MVP.</p><div className="stats"><article className="glass"><span>Catalog value</span><strong>{money.format(products.reduce((s,p)=>s+p.price*p.stock,0))}</strong><small>Across available inventory</small></article><article className="glass"><span>Products</span><strong>{products.length}</strong><small>{categories.length-1} active categories</small></article><article className="glass"><span>Units in stock</span><strong>{products.reduce((s,p)=>s+p.stock,0)}</strong><small>Demo inventory only</small></article></div><div className="inventory glass"><div className="inventory-heading"><h2>Inventory</h2><span>Read only</span></div>{products.map(p=><div className="inventory-row" key={p.id}><span className={`mini ${p.accent}`}>{p.emoji}</span><div><strong>{p.name}</strong><small>{p.category}</small></div><span>{money.format(p.price)}</span><span>{p.stock} units</span><span className="status">Active</span></div>)}</div></section>}
    {cartOpen&&<div className="drawer-backdrop" onMouseDown={()=>setCartOpen(false)}><aside className="cart-drawer" onMouseDown={e=>e.stopPropagation()} aria-label="Shopping cart"><div className="drawer-title"><div><span className="eyebrow">YOUR SELECTION</span><h2>Shopping bag</h2></div><button onClick={()=>setCartOpen(false)} aria-label="Close cart">×</button></div>{!entries.length?<div className="cart-empty"><span>◇</span><h3>Your bag is empty</h3><p>Add something beautiful from the collection.</p></div>:entries.map(item=><div className="cart-item" key={item.id}><span className={`mini ${item.accent}`}>{item.emoji}</span><div><strong>{item.name}</strong><small>{money.format(item.price)}</small></div><div className="quantity"><button onClick={()=>updateCart(item.id,-1)}>−</button><span>{item.quantity}</span><button onClick={()=>updateCart(item.id,1)}>+</button></div></div>)}<div className="cart-summary"><div><span>Subtotal</span><strong>{money.format(subtotal)}</strong></div><p>Demo checkout only. No card data is collected or transmitted.</p><button disabled={!itemCount} onClick={placeOrder}>Create demo order</button>{orderId&&<small>Most recent order: {orderId}</small>}</div></aside></div>}
    <footer><a className="brand" href="#top"><span>G</span>GlassCommerce</a><p>Open-source commerce, thoughtfully built.</p><a href="https://github.com/francoguilar0609-netizen/glasscommerce">GitHub ↗</a></footer>
  </main>
}
