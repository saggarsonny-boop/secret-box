import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

async function verifyPassword(formData: FormData) {
  'use server';
  const password = formData.get('password') as string;
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (password === expectedPassword) {
    const jar = await cookies();
    jar.set('admin_auth', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin',
      maxAge: 7 * 24 * 60 * 60
    });
  }
}

async function handleLogout() {
  'use server';
  const jar = await cookies();
  jar.delete('admin_auth');
}

export default async function AdminPage() {
  const jar = await cookies();
  const authCookie = jar.get('admin_auth');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const isAuthenticated = authCookie && authCookie.value === expectedPassword;

  if (!isAuthenticated) {
    return (
      <div style={{
        background: '#0A0A0A',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif",
        color: '#fff'
      }}>
        {/* Outfit & Playfair Display fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet" />
        
        <div style={{
          background: 'rgba(22, 26, 33, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '2.5rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          textAlign: 'center'
        }}>
          {/* Strict Branding Header */}
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 800,
            fontSize: '22px',
            letterSpacing: '1.5px',
            color: '#fff',
            position: 'relative',
            display: 'inline-block',
            marginBottom: '2rem'
          }}>
            THE NEW PHYSICIAN
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: '#D4AF37',
              opacity: 0.8
            }}></div>
          </div>

          <h2 style={{ fontSize: '18px', marginBottom: '1.5rem', color: '#A3A3A3', fontWeight: 500 }}>Admin Portal Access</h2>
          
          <form action={verifyPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="password"
              name="password"
              placeholder="Enter Admin Password"
              required
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '0.8rem 1rem',
                color: '#fff',
                fontSize: '14px',
                fontFamily: "'Outfit', sans-serif"
              }}
            />
            <button
              type="submit"
              style={{
                background: '#D4AF37',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.2s',
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Load metrics from Neon Database
  const sql = getDb();
  let totalViews = 0;
  let botViews = 0;
  let humanViews = 0;
  let checkoutsStarted = 0;
  let checkoutsCompleted = 0;
  let totalRevenueCents = 0;
  
  let conversions: any[] = [];
  let recentLogs: any[] = [];

  try {
    const metrics = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE action = 'page_view') as total_views,
        COUNT(*) FILTER (WHERE action = 'page_view' AND is_bot = true) as bot_views,
        COUNT(*) FILTER (WHERE action = 'page_view' AND is_bot = false) as human_views,
        COUNT(*) FILTER (WHERE action = 'checkout_started') as checkouts_started,
        COUNT(*) FILTER (WHERE action = 'checkout_completed') as checkouts_completed,
        COALESCE(SUM(conversion_value_cents) FILTER (WHERE action = 'checkout_completed'), 0) as total_rev
      FROM traffic_logs;
    `;
    
    if (metrics && metrics[0]) {
      totalViews = parseInt(metrics[0].total_views || '0');
      botViews = parseInt(metrics[0].bot_views || '0');
      humanViews = parseInt(metrics[0].human_views || '0');
      checkoutsStarted = parseInt(metrics[0].checkouts_started || '0');
      checkoutsCompleted = parseInt(metrics[0].checkouts_completed || '0');
      totalRevenueCents = parseInt(metrics[0].total_rev || '0');
    }

    conversions = await sql`
      SELECT plan, COUNT(*) as count 
      FROM traffic_logs 
      WHERE action = 'checkout_completed' 
      GROUP BY plan;
    `;

    recentLogs = await sql`
      SELECT timestamp, is_bot, action, plan, conversion_value_cents 
      FROM traffic_logs 
      ORDER BY timestamp DESC 
      LIMIT 15;
    `;
  } catch (err) {
    console.error('Failed to load traffic metrics from db:', err);
  }

  const humanPct = totalViews > 0 ? ((humanViews / totalViews) * 100).toFixed(1) : '0';
  const botPct = totalViews > 0 ? ((botViews / totalViews) * 100).toFixed(1) : '0';
  const convRate = checkoutsStarted > 0 ? ((checkoutsCompleted / checkoutsStarted) * 100).toFixed(1) : '0';

  return (
    <div style={{
      background: '#0A0A0A',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: "'Outfit', sans-serif",
      padding: '2rem 1rem'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet" />
      
      {/* Kintsugi style Top Border Gradient */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(to right, transparent, #D4AF37, transparent)',
        zIndex: 10000,
        opacity: 0.8
      }} />

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header Area */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Strict Branding logo */}
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 800,
            fontSize: '24px',
            letterSpacing: '1.5px',
            color: '#fff',
            position: 'relative',
            display: 'inline-block'
          }}>
            THE NEW PHYSICIAN
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: '#D4AF37',
              opacity: 0.8
            }}></div>
          </div>

          <form action={handleLogout}>
            <button type="submit" style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '0.5rem 1rem',
              color: '#A3A3A3',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
              fontFamily: "'Outfit', sans-serif"
            }}>Logout</button>
          </form>
        </div>

        {/* Overview Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}>
          {/* Total Views Card */}
          <div style={{
            background: 'rgba(22, 26, 33, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{ color: '#A3A3A3', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Visits</div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: '#fff' }}>{totalViews.toLocaleString()}</div>
            <div style={{ color: '#A3A3A3', fontSize: '11px', marginTop: '0.5rem' }}>
              <span style={{ color: '#D4AF37', fontWeight: 600 }}>{humanPct}%</span> human / <span style={{ fontWeight: 600 }}>{botPct}%</span> bots
            </div>
          </div>

          {/* Conversions Card */}
          <div style={{
            background: 'rgba(22, 26, 33, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{ color: '#A3A3A3', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Conversions</div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: '#D4AF37' }}>{checkoutsCompleted}</div>
            <div style={{ color: '#A3A3A3', fontSize: '11px', marginTop: '0.5rem' }}>
              Checkout Conversion Rate: <span style={{ color: '#fff', fontWeight: 600 }}>{convRate}%</span> ({checkoutsStarted} started)
            </div>
          </div>

          {/* Revenue Card */}
          <div style={{
            background: 'rgba(22, 26, 33, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{ color: '#A3A3A3', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Revenue (Gross)</div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: '#fff' }}>\${(totalRevenueCents / 100).toFixed(2)}</div>
            <div style={{ color: '#A3A3A3', fontSize: '11px', marginTop: '0.5rem' }}>
              Stripe verified payment callbacks
            </div>
          </div>
        </div>

        {/* Detailed Metrics Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          
          {/* Plan Breakdown */}
          <div style={{
            background: 'rgba(22, 26, 33, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '18px',
              fontWeight: 700,
              marginTop: 0,
              marginBottom: '1.2rem',
              color: '#D4AF37'
            }}>Plan Breakdown</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['plus', 'pro', 'boost'].map(p => {
                const count = conversions.find(c => c.plan === p)?.count || 0;
                return (
                  <div key={p} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingBottom: '0.5rem'
                  }}>
                    <span style={{ textTransform: 'uppercase', fontSize: '12px', color: '#A3A3A3', letterSpacing: '0.05em' }}>{p}</span>
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traffic Logs */}
          <div style={{
            background: 'rgba(22, 26, 33, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '18px',
              fontWeight: 700,
              marginTop: 0,
              marginBottom: '1.2rem',
              color: '#D4AF37'
            }}>Live Stream (Recent Events)</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '350px', overflowY: 'auto' }}>
              {recentLogs.map((log, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.02)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500, color: log.action === 'checkout_completed' ? '#D4AF37' : '#fff' }}>
                      {log.action === 'page_view' && 'Page View'}
                      {log.action === 'checkout_started' && `Checkout Started (${log.plan})`}
                      {log.action === 'checkout_completed' && `Conversion - ${log.plan} (+$${(log.conversion_value_cents/100).toFixed(2)})`}
                    </span>
                    <span style={{ fontSize: '10px', color: '#A3A3A3', marginTop: '2px' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: log.is_bot ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                      color: log.is_bot ? '#ff4d4d' : '#4dff4d',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      fontWeight: 600
                    }}>
                      {log.is_bot ? 'Bot' : 'Human'}
                    </span>
                  </div>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div style={{ color: '#A3A3A3', textAlign: 'center', padding: '2rem' }}>No recent events recorded.</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
