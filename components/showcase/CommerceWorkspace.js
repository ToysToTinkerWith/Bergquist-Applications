import React, { useState } from "react"
import AddRoundedIcon from "@mui/icons-material/AddRounded"
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined"
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded"
import { Workspace, Tool, Search, Select, Empty, Modal, s } from "./Workspace"
import useLocalDemo from "./useLocalDemo"
import { DEMO_PRODUCTS, cartTotals, money, csvText, downloadFile } from "../../lib/componentDemos"

export default function CommerceWorkspace() {
  const [search, setSearch] = useState(""), [category, setCategory] = useState("All"), [sort, setSort] = useState("name"), [review, setReview] = useState(false), [receipt, setReceipt] = useState(null), [receiptOpen, setReceiptOpen] = useState(false), [notice, setNotice] = useState("")
  const [cart, setCart, storage] = useLocalDemo("bergquist-cart-demo-v1", {}, value => value && !Array.isArray(value) && typeof value === "object" && Object.entries(value).every(([key, quantity]) => DEMO_PRODUCTS.some(product => product.id === key && quantity <= product.stock) && Number.isInteger(quantity) && quantity >= 0))
  const totals = cartTotals(cart)
  const products = DEMO_PRODUCTS.filter(product => (category === "All" || category === product.category) && `${product.name} ${product.description}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => sort === "low" ? a.cents - b.cents : sort === "high" ? b.cents - a.cents : a.name.localeCompare(b.name))
  function quantity(product, next) {
    const count = Math.max(0, Math.min(product.stock, Math.floor(Number(next) || 0)))
    setCart(current => ({ ...current, [product.id]: count }))
  }
  function add(product) { quantity(product, (cart[product.id] || 0) + 1); setNotice(`${product.name} added to cart.`) }
  function placeOrder() {
    if (!totals.items.length) return
    setReceipt({ ...totals, id: `DEMO-${Date.now().toString(36).toUpperCase()}` }); setReceiptOpen(true); setReview(false); setCart({}); setNotice("Demo order completed. No payment was taken.")
  }
  return <Workspace title="Expedition supply" status="Sample products · Demo checkout · No payments" actions={<span className={s.badge}>{totals.count} {totals.count === 1 ? "item" : "items"} in cart</span>}>
    <div className={s.toolbar}><Search label="Search products" value={search} onChange={setSearch} /><div className={s.row}><Select label="Category" value={category} onChange={setCategory} options={["All", "Navigation", "Equipment"]} /><Select label="Sort" value={sort} onChange={setSort} options={[{ value: "name", label: "Name" }, { value: "low", label: "Price: low to high" }, { value: "high", label: "Price: high to low" }]} /></div></div>
    {storage.storageError && <p className={s.notice} role="status">{storage.storageError}</p>}
    {notice && <p className={s.notice} role="status">{notice}</p>}
    <div className={s.split}><div>{products.length ? <div className={s.productGrid}>{products.map(product => <article className={s.product} key={product.id}><img className={s.productImage} src={product.image} alt={product.name} loading="lazy" /><div className={s.productInfo}><span className={s.badge}>{product.category}</span><h3 style={{ marginTop: 12 }}>{product.name}</h3><p>{product.description}</p><strong>{money(product.cents)}</strong><p>{product.stock - (cart[product.id] || 0)} available</p><button className={s.button} disabled={!storage.ready || (cart[product.id] || 0) >= product.stock} onClick={() => add(product)}><AddRoundedIcon fontSize="small" />{(cart[product.id] || 0) >= product.stock ? "Limit reached" : "Add to cart"}</button></div></article>)}</div> : <Empty title="No matching products" onReset={() => { setSearch(""); setCategory("All") }} />}</div>
      <aside className={`${s.aside} ${s.cart}`} aria-label="Shopping cart"><div className={s.heading}><h3>Your cart</h3><ShoppingBagOutlinedIcon sx={{ color: "#b0a0ec" }} /></div>
        {!totals.items.length ? <Empty title="Your cart is empty" /> : <><ul className={s.list}>{totals.items.map(product => <li key={product.id} className={s.listItem}><img src={product.image} alt="" /><div><strong>{product.name}</strong><p>{money(product.cents * product.quantity)}</p><div className={s.quantity}><Tool label={`Decrease ${product.name}`} onClick={() => quantity(product, product.quantity - 1)}><RemoveRoundedIcon fontSize="small" /></Tool><input type="number" min="0" max={product.stock} aria-label={`${product.name} quantity`} value={product.quantity} onChange={event => quantity(product, event.target.value)} /><Tool label={`Increase ${product.name}`} disabled={product.quantity >= product.stock} onClick={() => quantity(product, product.quantity + 1)}><AddRoundedIcon fontSize="small" /></Tool><Tool label={`Remove ${product.name}`} onClick={() => quantity(product, 0)}><DeleteOutlineRoundedIcon fontSize="small" /></Tool></div></div></li>)}</ul>
          <dl className={s.summary}><div><dt>Subtotal</dt><dd>{money(totals.subtotal)}</dd></div><div><dt>Demo delivery</dt><dd>Included</dd></div><div><dt>Total</dt><dd>{money(totals.total)}</dd></div></dl><button className={s.primary} onClick={() => setReview(true)}>Review demo order</button></>}
        {receipt && <p style={{ marginTop: 20 }}><button className={s.button} onClick={() => setReceiptOpen(true)}>View last receipt</button></p>}
      </aside>
    </div>
    <Modal title="Review demo order" open={review} onClose={() => setReview(false)}><p className={s.notice}>Sample checkout. No card details or payment required.</p><ul className={s.list}>{totals.items.map(item => <li key={item.id} className={s.listItem}><div>{item.quantity} x {item.name}</div><strong>{money(item.cents * item.quantity)}</strong></li>)}</ul><dl className={s.summary}><div><dt>Total</dt><dd>{money(totals.total)}</dd></div></dl><div className={s.formActions}><button className={s.button} onClick={() => setReview(false)}>Back to cart</button><button className={s.primary} disabled={!totals.count} onClick={placeOrder}>Place demo order</button></div></Modal>
    <Modal title="Demo order complete" open={receiptOpen} onClose={() => setReceiptOpen(false)}>{receipt && <><p className={s.notice}>No payment taken. This is a sample receipt.</p><p>{receipt.id}</p><ul className={s.list}>{receipt.items.map(item => <li className={s.listItem} key={item.id}><div>{item.quantity} x {item.name}</div>{money(item.cents * item.quantity)}</li>)}</ul><dl className={s.summary}><div><dt>Total</dt><dd>{money(receipt.total)}</dd></div></dl><div className={s.formActions}><button className={s.button} onClick={() => downloadFile(`${receipt.id}.csv`, csvText(["Demo order - no payment", "Quantity", "Unit USD", "Total USD"], receipt.items.map(item => [item.name, item.quantity, item.cents / 100, item.quantity * item.cents / 100])))}><FileDownloadRoundedIcon fontSize="small" />Receipt</button><button className={s.primary} onClick={() => setReceiptOpen(false)}>Continue browsing</button></div></>}</Modal>
  </Workspace>
}
