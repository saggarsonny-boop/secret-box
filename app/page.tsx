'use client';
import { useEffect, useState } from 'react';

type Secret = { id: number; content: string; category: string; resonance: number; created_at: string; ai_response?: string };

const CATEGORIES = ['general','love','fear','hope','shame','grief','joy'];

export default function Home() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [view, setView] = useState<'feed'|'submit'>('feed');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { fetch('/api/secrets').then(r=>r.json()).then(setSecrets).catch(()=>{}); }, []);

  async function handleSubmit() {
    if (content.length < 5) return;
    setLoading(true);
    await fetch('/api/secrets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content, category}) });
    setSubmitted(true);
    setLoading(false);
    setContent('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
  }

  async function handleResonate(id: number) {
    await fetch('/api/resonate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id}) });
    setSecrets(s => s.map(x => x.id === id ? {...x, resonance: x.resonance+1} : x));
  }

  return (
    <main style={{background:'#0a0a0a',minHeight:'100vh',color:'#e8e8e8',fontFamily:'Georgia,serif',maxWidth:'600px',margin:'0 auto',padding:'24px 16px'}}>
      <div style={{textAlign:'center',marginBottom:'32px'}}>
        <h1 style={{fontSize:'28px',fontWeight:'300',letterSpacing:'4px',color:'#c8b8a2'}}>THE SECRET BOX</h1>
        <p style={{fontSize:'13px',color:'#666',marginTop:'8px'}}>you are not alone</p>
      </div>
      <div style={{display:'flex',gap:'12px',marginBottom:'32px',justifyContent:'center'}}>
        <button onClick={()=>{setView('feed');setSubmitted(false)}} style={{background: view==='feed'?'#c8b8a2':'transparent',color: view==='feed'?'#0a0a0a':'#c8b8a2',border:'1px solid #c8b8a2',padding:'8px 24px',cursor:'pointer',letterSpacing:'2px',fontSize:'12px'}}>READ</button>
        <button onClick={()=>setView('submit')} style={{background: view==='submit'?'#c8b8a2':'transparent',color: view==='submit'?'#0a0a0a':'#c8b8a2',border:'1px solid #c8b8a2',padding:'8px 24px',cursor:'pointer',letterSpacing:'2px',fontSize:'12px'}}>SHARE</button>
      </div>
      {view === 'feed' && (
        <div>
          {secrets.length === 0 && <p style={{textAlign:'center',color:'#444',fontSize:'14px'}}>No secrets yet. Be the first.</p>}
          {secrets.map(s => (
            <div key={s.id} style={{borderLeft:'2px solid #333',paddingLeft:'16px',marginBottom:'36px'}}>
              <p style={{fontSize:'13px',color:'#888',marginBottom:'8px',letterSpacing:'2px'}}>{s.category.toUpperCase()}</p>
              <p style={{fontSize:'16px',lineHeight:'1.7',color:'#ddd'}}>{s.content}</p>
              {s.ai_response && (
                <p style={{fontSize:'14px',lineHeight:'1.7',color:'#c8b8a2',marginTop:'12px',fontStyle:'italic',borderLeft:'1px solid #444',paddingLeft:'12px'}}>{s.ai_response}</p>
              )}
              <button onClick={()=>handleResonate(s.id)} style={{background:'none',border:'none',color:'#666',cursor:'pointer',marginTop:'12px',fontSize:'13px',padding:'0'}}>
                ◇ {s.resonance} felt this
              </button>
            </div>
          ))}
        </div>
      )}
      {view === 'submit' && !submitted && (
        <div>
          <p style={{fontSize:'13px',color:'#666',marginBottom:'24px',lineHeight:'1.8'}}>This is anonymous. No account. No trace. Just your truth.<br/><span style={{color:'#444'}}>Press Ctrl+Enter to submit.</span></p>
          <select value={category} onChange={e=>setCategory(e.target.value)} style={{background:'#111',color:'#c8b8a2',border:'1px solid #333',padding:'8px',width:'100%',marginBottom:'16px',fontSize:'13px',letterSpacing:'1px'}}>
            {CATEGORIES.map(c=><option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
          <textarea value={content} onChange={e=>setContent(e.target.value)} onKeyDown={handleKeyDown} placeholder="your secret... (Ctrl+Enter to submit)" rows={6} style={{width:'100%',background:'#111',color:'#e8e8e8',border:'1px solid #333',padding:'16px',fontSize:'15px',lineHeight:'1.7',resize:'vertical',fontFamily:'Georgia,serif',boxSizing:'border-box'}} />
          <button onClick={handleSubmit} disabled={loading||content.length<5} style={{marginTop:'16px',width:'100%',background:'#c8b8a2',color:'#0a0a0a',border:'none',padding:'14px',fontSize:'13px',letterSpacing:'3px',cursor:'pointer'}}>
            {loading ? 'SENDING...' : 'RELEASE IT'}
          </button>
        </div>
      )}
      {view === 'submit' && submitted && (
        <div style={{textAlign:'center',padding:'48px 0'}}>
          <p style={{fontSize:'20px',color:'#c8b8a2',marginBottom:'16px'}}>it's out there now</p>
          <p style={{fontSize:'14px',color:'#666'}}>someone will feel less alone because of you</p>
          <button onClick={()=>{setView('feed');setSubmitted(false)}} style={{marginTop:'32px',background:'none',border:'1px solid #444',color:'#888',padding:'8px 24px',cursor:'pointer',fontSize:'12px',letterSpacing:'2px'}}>READ THE OTHERS</button>
        </div>
      )}
    </main>
  );
}
