'use client'
import { useEffect, useState } from 'react'

const KEY = 'hive_welcomed_secretbox'

export default function FirstVisitCard() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { if (!localStorage.getItem(KEY)) setVisible(true) }, [])
  if (!visible) return null
  const dismiss = () => { localStorage.setItem(KEY, '1'); setVisible(false) }
  return (
    <div onClick={dismiss} style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'24px',pointerEvents:'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'rgba(17,10,30,0.97)',border:'1px solid rgba(150,130,200,0.25)',borderRadius:'16px',padding:'20px 24px',maxWidth:'420px',width:'100%',display:'flex',flexDirection:'column',gap:'12px' }}>
        <p style={{ margin:0,fontSize:'16px',color:'#f0eeff',lineHeight:'1.5' }}>
          Say the thing you've never said. Anonymously. No account needed. Try it →
        </p>
        <button onClick={dismiss} style={{ alignSelf:'flex-end',background:'rgba(150,130,200,0.1)',border:'1px solid rgba(150,130,200,0.3)',borderRadius:'100px',padding:'8px 20px',color:'#c8b4ff',fontSize:'13px',fontFamily:'inherit',cursor:'pointer' }}>Got it</button>
      </div>
    </div>
  )
}



{/* Stripe Checkout Block */}
<div id="stripe-checkout-cta" style={{ margin: '2rem auto', padding: '2.5rem', borderRadius: '16px', background: 'rgba(22, 26, 33, 0.65)', border: '1px solid rgba(212, 175, 55, 0.25)', textAlign: 'center', fontFamily: 'Outfit, sans-serif', maxWidth: '600px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
    <h3 style={{ marginTop: 0, color: '#fff' }}>Activate Premium License</h3>
    <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/9B6aEZ7Qzd3rcw2bDz0RG02" target="_blank" style={{ display: 'inline-block', padding: '0.8rem 2rem', background: '#D4AF37', color: '#000000', fontWeight: '800', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.3s ease', letterSpacing: '0.5px' }}>Unlock Now</a>
</div>
