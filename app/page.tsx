'use client';
import { useEffect, useState } from 'react';

type Secret = { id: number; content: string; category: string; resonance: number; created_at: string; ai_response?: string };

const CATEGORIES = ['all','general','love','fear','hope','shame','grief','joy'];

export default function Home() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'feed'|'submit'>('feed');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resonated, setResonated] = useState<Set<number>>(new Set());
  const [pulsing, setPulsing] = useState<number|null>(null);
  const [sharing, setSharing] = useState<number|null>(null);

  useEffect(() => { fetch('/api/secrets').then(r=>r.json()).then(setSecrets).catch(()=>{}); }, []);

  const totalResonance = secrets.reduce((sum, s) => sum + s.resonance, 0);
  const filtered = filter === 'all' ? secrets : secrets.filter(s => s.category === filter);

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
    if (resonated.has(id)) return;
    setPulsing(id);
    setTimeout(() => setPulsing(null), 600);
    setResonated(prev => new Set([...prev, id]));
    await fetch('/api/resonate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id}) });
    setSecrets(s => s.map(x => x.id === id ? {...x, resonance: x.resonance+1} : x));
  }

  async function handleShare(secret: Secret) {
    setSharing(secret.id);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.strokeStyle = '#c8b8a2';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, 960, 960);
    ctx.fillStyle = '#c8b8a2';
    ctx.font = '28px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('THE SECRET BOX', 540, 140);
    ctx.fillStyle = '#666';
    ctx.font = '22px Georgia';
    ctx.fillText(secret.category.toUpperCase(), 540, 200);
    ctx.fillStyle = '#e8e8e8';
    ctx.font = '38px Georgia';
    const words = secret.content.split(' ');
    let line = '';
    let y = 420;
    const maxWidth = 820;
    const lines: string[] = [];
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line.trim());
        line = word + ' ';
      } else { line = test; }
    }
    if (line) lines.push(line.trim());
    const startY = 540 - ((lines.length - 1) * 56) / 2;
    lines.forEach((l, i) => { ctx.fillText(l, 540, startY + i * 56); });
    ctx.fillStyle = '#c8b8a2';
    ctx.font = '24px Georgia';
    ctx.fillText('you are not alone', 540, 900);
    ctx.fillStyle = '#444';
    ctx.font = '20px Georgia';
    ctx.fillText('bit.ly/secret-safe', 540, 960);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'secret-box.png';
      a.click();
      URL.revokeObjectURL(url);
      setSharing(null);
    });
  }

  return (
    <main style={{background:'#0a0a0a',minHeight:'100vh',color:'#e8e8e8',fontFamily:'Georgia,serif',maxWidth:'600px',margin:'0 auto',padding:'24px 16px'}}>
      <div style={{textAlign:'center',marginBottom:'24px'}}>
        <h1 style={{fontSize:'28px',fontWeight:'300',letterSpacing:'4px',color:'#c8b8a2'}}>THE SECRET BOX</h1>
        <p style={{fontSize:'13px',color:'#666',marginTop:'8px'}}>you are not alone</p>
        {totalResonance > 0 && (
          <p style={{fontSize:'12px',color:'#444',marginTop:'8px',letterSpacing:'1px'}}>
            {totalResonance.toLocaleString()} moments of connection
          </p>
        )}
      </div>

      <div style={{display:'flex',gap:'12px',marginBottom:'24px',justifyContent:'center'}}>
        <button onClick={()=>{setView('feed');setSubmitted(false)}} style={{background: view==='feed'?'#c8b8a2':'transparent',color: view==='feed'?'#0a0a0a':'#c8b8a2',border:'1px solid #c8b8a2',padding:'8px 24px',cursor:'pointer',letterSpacing:'2px',fontSize:'12px'}}>READ</button>
        <button onClick={()=>setView('submit')} style={{background: view==='submit'?'#c8b8a2':'transparent',color: view==='submit'?'#0a0a0a':'#c8b8a2',border:'1px solid #c8b8a2',padding:'8px 24px',cursor:'pointer',letterSpacing:'2px',fontSize:'12px'}}>SHARE</button>
      </div>

      {view === 'feed' && (
        <div>
          <div style={{display:'flex',gap:'8px',marginBottom:'24px',flexWrap:'wrap',justifyContent:'center'}}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={()=>setFilter(c)} style={{background: filter===c?'#c8b8a2':'transparent',color: filter===c?'#0a0a0a':'#555',border:'1px solid #333',padding:'4px 12px',cursor:'pointer',fontSize:'11px',letterSpacing:'1px'}}>
                {c.toUpperCase()}
              </button>
            ))}
          </div>
          {filtered.length === 0 && <p style={{textAlign:'center',color:'#444',fontSize:'14px'}}>No secrets here yet.</p>}
          {filtered.map(s => (
            <div key={s.id} style={{borderLeft:'2px solid #222',paddingLeft:'16px',marginBottom:'36px'}}>
              <p style={{fontSize:'13px',color:'#555',marginBottom:'8px',letterSpacing:'2px'}}>{s.category.toUpperCase()}</p>
              <p style={{fontSize:'16px',lineHeight:'1.7',color:'#ddd'}}>{s.content}</p>
              {s.ai_response && s.ai_response !== 'You are not alone in this.' && (
                <p style={{fontSize:'14px',lineHeight:'1.7',color:'#c8b8a2',marginTop:'12px',fontStyle:'italic',borderLeft:'1px solid #333',paddingLeft:'12px'}}>{s.ai_response}</p>
              )}
              <div style={{display:'flex',gap:'16px',marginTop:'12px',alignItems:'center'}}>
                <button onClick={()=>handleResonate(s.id)} style={{background:'none',border:'none',color: resonated.has(s.id)?'#c8b8a2':'#555',cursor: resonated.has(s.id)?'default':'pointer',fontSize:'13px',padding:'0',transition:'all 0.3s',transform: pulsing===s.id?'scale(1.4)':'scale(1)'}}>
                  {resonated.has(s.id) ? '◆' : '◇'} {s.resonance} felt this
                </button>
                <button onClick={()=>handleShare(s)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'11px',padding:'0',letterSpacing:'1px'}}>
                  {sharing===s.id ? 'CREATING...' : '↗ SHARE'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'submit' && !submitted && (
        <div>
          <p style={{fontSize:'13px',color:'#666',marginBottom:'24px',lineHeight:'1.8'}}>This is anonymous. No account. No trace. Just your truth.<br/><span style={{color:'#444'}}>Ctrl+Enter to submit.</span></p>
          <select value={category} onChange={e=>setCategory(e.target.value)} style={{background:'#111',color:'#c8b8a2',border:'1px solid #333',padding:'8px',width:'100%',marginBottom:'16px',fontSize:'13px',letterSpacing:'1px'}}>
            {CATEGORIES.filter(c=>c!=='all').map(c=><option key={c} value={c}>{c.toUpperCase()}</option>)}
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
