'use client';
import { useEffect, useState, useRef } from 'react';

type Secret = { id: number; content: string; category: string; resonance: number; created_at: string; ai_response?: string; image_url?: string };

const MOODS = ['hollow','anxious','hopeful','numb','ashamed','seen','grief','love'];
const FILTERS = ['all', ...MOODS];

export default function Home() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'feed'|'submit'|'followup'>('feed');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [followupAnswer, setFollowupAnswer] = useState('');
  const [followupDone, setFollowupDone] = useState(false);
  const [resonated, setResonated] = useState<Set<number>>(new Set());
  const [pulsing, setPulsing] = useState<number|null>(null);
  const [sharing, setSharing] = useState<number|null>(null);
  const [random, setRandom] = useState<Secret|null>(null);
  const [imagePreview, setImagePreview] = useState<string|null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string|null>(null);
  const [imageError, setImageError] = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch('/api/secrets').then(r=>r.json()).then(setSecrets).catch(()=>{}); }, []);

  const totalResonance = secrets.reduce((sum, s) => sum + s.resonance, 0);
  const filtered = filter === 'all' ? secrets : secrets.filter(s => s.category === filter);

  function showRandom() {
    const pool = secrets.filter(s => s.id !== random?.id);
    if (pool.length === 0) return;
    setRandom(pool[Math.floor(Math.random() * pool.length)]);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setImageError('Image must be under 5MB'); return; }
    setImageError(null);
    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
      try {
        const res = await fetch('/api/upload', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({image: base64}) });
        const data = await res.json();
        if (data.error) { setImageError(data.error === 'Image not allowed' ? 'That image cannot be shared here.' : 'Upload failed. Try another image.'); setImagePreview(null); }
        else setImageUrl(data.url);
      } catch { setImageError('Upload failed.'); setImagePreview(null); }
      setImageUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() { setImagePreview(null); setImageUrl(null); setImageError(null); if (fileRef.current) fileRef.current.value = ''; }

  async function handleSubmit() {
    if (content.length < 5 || !category || imageUploading) return;
    setLoading(true);
    await fetch('/api/secrets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content, category, image_url: imageUrl}) });
    setLoading(false);
    setSubmitted(true);
    setView('followup');
  }

  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }

  async function handleResonate(id: number) {
    if (resonated.has(id)) return;
    setPulsing(id);
    setTimeout(() => setPulsing(null), 600);
    setResonated(prev => new Set([...prev, id]));
    await fetch('/api/resonate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id}) });
    setSecrets(s => s.map(x => x.id === id ? {...x, resonance: x.resonance+1} : x));
    if (random?.id === id) setRandom(prev => prev ? {...prev, resonance: prev.resonance+1} : null);
  }

  async function handleShare(secret: Secret) {
    setSharing(secret.id);
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 1080, 1080);
    if (secret.image_url) {
      const img = new Image(); img.crossOrigin = 'anonymous';
      await new Promise(r => { img.onload = r; img.src = secret.image_url!; });
      ctx.globalAlpha = 0.3; ctx.drawImage(img, 0, 0, 1080, 1080); ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = '#c8b8a2'; ctx.lineWidth = 2; ctx.strokeRect(60, 60, 960, 960);
    ctx.fillStyle = '#c8b8a2'; ctx.font = '28px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('THE SECRET BOX', 540, 140);
    ctx.fillStyle = '#666'; ctx.font = '22px Georgia'; ctx.fillText(secret.category.toUpperCase(), 540, 200);
    ctx.fillStyle = '#e8e8e8'; ctx.font = '38px Georgia';
    const words = secret.content.split(' '); let line = ''; const lines: string[] = [];
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > 820 && line) { lines.push(line.trim()); line = word + ' '; } else line = test;
    }
    if (line) lines.push(line.trim());
    const startY = 540 - ((lines.length - 1) * 56) / 2;
    lines.forEach((l, i) => ctx.fillText(l, 540, startY + i * 56));
    ctx.fillStyle = '#c8b8a2'; ctx.font = '24px Georgia'; ctx.fillText('you are not alone', 540, 900);
    ctx.fillStyle = '#444'; ctx.font = '20px Georgia'; ctx.fillText('bit.ly/secret-safe', 540, 960);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = 'secret-box.png'; a.click(); URL.revokeObjectURL(url); setSharing(null);
    });
  }

  const SecretCard = ({ s, featured = false }: { s: Secret; featured?: boolean }) => (
    <div style={{borderLeft: featured?'none':'2px solid #1a1a1a', border: featured?'1px solid #c8b8a2':undefined, background: featured?'#111':undefined, padding: featured?'20px':'0 0 0 16px', marginBottom:'36px'}}>
      {s.image_url && <img src={s.image_url} alt="" style={{width:'100%',maxHeight:'300px',objectFit:'cover',marginBottom:'12px',opacity:0.85}} />}
      <p style={{fontSize:'11px',color: featured?'#888':'#444',marginBottom:'8px',letterSpacing:'2px'}}>{s.category.toUpperCase()}{featured?' · SOMEONE\'S TRUTH':''}</p>
      <p style={{fontSize: featured?'17px':'16px',lineHeight:'1.7',color: featured?'#fff':'#ccc'}}>{s.content}</p>
      {s.ai_response && s.ai_response !== 'You are not alone in this.' && (
        <p style={{fontSize:'14px',lineHeight:'1.7',color:'#c8b8a2',marginTop:'12px',fontStyle:'italic',borderLeft:'1px solid #333',paddingLeft:'12px'}}>{s.ai_response}</p>
      )}
      <div style={{display:'flex',gap:'16px',marginTop:'12px',alignItems:'center',flexWrap:'wrap'}}>
        <button onClick={()=>handleResonate(s.id)} style={{background:'none',border:'none',color: resonated.has(s.id)?'#c8b8a2':'#555',cursor: resonated.has(s.id)?'default':'pointer',fontSize:'13px',padding:'0',transition:'all 0.3s',transform: pulsing===s.id?'scale(1.4)':'scale(1)'}}>
          {resonated.has(s.id)?'◆':'◇'} {s.resonance} me too
        </button>
        <button onClick={()=>handleShare(s)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'11px',letterSpacing:'1px'}}>
          {sharing===s.id?'CREATING...':'↗ SHARE'}
        </button>
        {featured && <button onClick={showRandom} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'11px',letterSpacing:'1px'}}>→ NEXT</button>}
      </div>
    </div>
  );

  return (
    <main style={{background:'#0a0a0a',minHeight:'100vh',color:'#e8e8e8',fontFamily:'Georgia,serif',maxWidth:'600px',margin:'0 auto',padding:'24px 16px'}}>
      <div style={{textAlign:'center',marginBottom:'24px'}}>
        <h1 style={{fontSize:'28px',fontWeight:'300',letterSpacing:'4px',color:'#c8b8a2'}}>THE SECRET BOX</h1>
        <p style={{fontSize:'13px',color:'#666',marginTop:'8px'}}>you are not alone</p>
        {totalResonance > 0 && <p style={{fontSize:'12px',color:'#444',marginTop:'8px',letterSpacing:'1px'}}>{totalResonance.toLocaleString()} people said me too</p>}
      </div>

      <div style={{display:'flex',gap:'12px',marginBottom:'24px',justifyContent:'center'}}>
        <button onClick={()=>{setView('feed');setRandom(null)}} style={{background: view==='feed'?'#c8b8a2':'transparent',color: view==='feed'?'#0a0a0a':'#c8b8a2',border:'1px solid #c8b8a2',padding:'8px 24px',cursor:'pointer',letterSpacing:'2px',fontSize:'12px'}}>READ</button>
        <button onClick={()=>setView('submit')} style={{background: view==='submit'||view==='followup'?'#c8b8a2':'transparent',color: view==='submit'||view==='followup'?'#0a0a0a':'#c8b8a2',border:'1px solid #c8b8a2',padding:'8px 24px',cursor:'pointer',letterSpacing:'2px',fontSize:'12px'}}>SHARE</button>
      </div>

      {view === 'feed' && (
        <div>
          <div style={{textAlign:'center',marginBottom:'24px'}}>
            <button onClick={showRandom} style={{background:'#111',border:'1px solid #c8b8a2',color:'#c8b8a2',padding:'10px 28px',cursor:'pointer',fontSize:'12px',letterSpacing:'2px'}}>✦ SHOW ME SOMEONE'S TRUTH</button>
          </div>
          {random && <SecretCard s={random} featured={true} />}
          <div style={{display:'flex',gap:'6px',marginBottom:'24px',flexWrap:'wrap',justifyContent:'center'}}>
            {FILTERS.map(c => (
              <button key={c} onClick={()=>setFilter(c)} style={{background: filter===c?'#c8b8a2':'transparent',color: filter===c?'#0a0a0a':'#555',border:'1px solid #222',padding:'4px 12px',cursor:'pointer',fontSize:'11px',letterSpacing:'1px'}}>{c.toUpperCase()}</button>
            ))}
          </div>
          {filtered.length === 0 && <p style={{textAlign:'center',color:'#444',fontSize:'14px'}}>Nothing here yet.</p>}
          {filtered.map(s => <SecretCard key={s.id} s={s} />)}
        </div>
      )}

      {view === 'submit' && !submitted && (
        <div>
          <p style={{fontSize:'14px',color:'#666',marginBottom:'28px',lineHeight:'1.8',textAlign:'center'}}>Anonymous. No account. No trace.<br/>Just your truth.<br/><span style={{color:'#555',fontSize:'12px'}}>Once shared, secrets are permanent. Never include your name, email, or phone number. Images must not show recognizable faces.</span></p>
          <p style={{fontSize:'13px',color:'#888',marginBottom:'16px',letterSpacing:'1px'}}>HOW ARE YOU FEELING RIGHT NOW?</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'24px'}}>
            {MOODS.map(m => (
              <button key={m} onClick={()=>setCategory(m)} style={{background: category===m?'#c8b8a2':'#111',color: category===m?'#0a0a0a':'#666',border:`1px solid ${category===m?'#c8b8a2':'#333'}`,padding:'8px 16px',cursor:'pointer',fontSize:'13px',letterSpacing:'1px',transition:'all 0.2s'}}>{m}</button>
            ))}
          </div>
          <textarea value={content} onChange={e=>setContent(e.target.value)} onKeyDown={handleKeyDown} placeholder="your secret... (Ctrl+Enter to submit)" rows={6} style={{width:'100%',background:'#111',color:'#e8e8e8',border:'1px solid #333',padding:'16px',fontSize:'15px',lineHeight:'1.7',resize:'vertical',fontFamily:'Georgia,serif',boxSizing:'border-box'}} />
          
          <div style={{marginTop:'16px'}}>
            {!imagePreview && (
              <button onClick={()=>fileRef.current?.click()} style={{background:'none',border:'1px dashed #333',color:'#555',padding:'10px 20px',cursor:'pointer',fontSize:'12px',letterSpacing:'1px',width:'100%'}}>
                + ADD AN IMAGE (optional)
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
            {imageUploading && <p style={{color:'#666',fontSize:'12px',marginTop:'8px',textAlign:'center'}}>checking image...</p>}
            {imageError && <p style={{color:'#c44',fontSize:'12px',marginTop:'8px',textAlign:'center'}}>{imageError}</p>}
            {imagePreview && !imageUploading && !imageError && (
              <div style={{position:'relative',marginTop:'8px'}}>
                <img src={imagePreview} alt="" style={{width:'100%',maxHeight:'200px',objectFit:'cover',opacity:0.7}} />
                <button onClick={removeImage} style={{position:'absolute',top:'8px',right:'8px',background:'#0a0a0a',border:'1px solid #333',color:'#888',padding:'4px 8px',cursor:'pointer',fontSize:'11px'}}>REMOVE</button>
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={loading||content.length<5||!category||imageUploading} style={{marginTop:'16px',width:'100%',background: content.length>=5&&category&&!imageUploading?'#c8b8a2':'#222',color: content.length>=5&&category&&!imageUploading?'#0a0a0a':'#444',border:'none',padding:'14px',fontSize:'13px',letterSpacing:'3px',cursor: content.length>=5&&category&&!imageUploading?'pointer':'default',transition:'all 0.3s'}}>
            {loading?'SENDING...':imageUploading?'CHECKING IMAGE...':'RELEASE IT'}
          </button>
        </div>
      )}

      {view === 'followup' && !followupDone && (
        <div style={{textAlign:'center',padding:'32px 0'}}>
          <p style={{fontSize:'20px',color:'#c8b8a2',marginBottom:'16px'}}>it's out there now</p>
          <p style={{fontSize:'14px',color:'#666',marginBottom:'32px'}}>someone will feel less alone because of you</p>
          <div style={{background:'#111',border:'1px solid #333',padding:'24px',textAlign:'left'}}>
            <p style={{fontSize:'14px',color:'#888',marginBottom:'16px',fontStyle:'italic'}}>do you want to say more?</p>
            <textarea value={followupAnswer} onChange={e=>setFollowupAnswer(e.target.value)} placeholder="there's more space here if you need it..." rows={4} style={{width:'100%',background:'#0a0a0a',color:'#e8e8e8',border:'1px solid #222',padding:'12px',fontSize:'14px',lineHeight:'1.7',resize:'none',fontFamily:'Georgia,serif',boxSizing:'border-box'}} />
            <div style={{display:'flex',gap:'12px',marginTop:'12px'}}>
              <button onClick={()=>setFollowupDone(true)} style={{flex:1,background:'none',border:'1px solid #333',color:'#666',padding:'10px',cursor:'pointer',fontSize:'12px',letterSpacing:'1px'}}>NO, I'M DONE</button>
              <button onClick={()=>setFollowupDone(true)} disabled={followupAnswer.length<2} style={{flex:2,background: followupAnswer.length>=2?'#c8b8a2':'#111',color: followupAnswer.length>=2?'#0a0a0a':'#333',border:'none',padding:'10px',cursor:'pointer',fontSize:'12px',letterSpacing:'2px',transition:'all 0.3s'}}>RELEASE THIS TOO</button>
            </div>
          </div>
        </div>
      )}

      {view === 'followup' && followupDone && (
        <div style={{textAlign:'center',padding:'48px 0'}}>
          <p style={{fontSize:'20px',color:'#c8b8a2',marginBottom:'16px'}}>you've been heard</p>
          <p style={{fontSize:'14px',color:'#666',marginBottom:'32px'}}>that took courage</p>
          <button onClick={()=>{setView('feed');setSubmitted(false);setFollowupAnswer('');setFollowupDone(false);setContent('');setCategory('');setImagePreview(null);setImageUrl(null);}} style={{background:'none',border:'1px solid #333',color:'#666',padding:'10px 28px',cursor:'pointer',fontSize:'12px',letterSpacing:'2px'}}>READ THE OTHERS</button>
        </div>
      )}
    </main>
  );
}
