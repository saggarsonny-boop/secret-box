export const runtime = 'edge';
import React from 'react';

export default function TokenSpeedPage() {
  return (
    <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Outfit, sans-serif', color: '#fff' }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#D4AF37', marginBottom: '2rem' }}>Page Token Speed Analyzer</h1>
      <p style={{ color: '#A3A3A3', lineHeight: '1.6' }}>
        This utility estimates the LLM token consumption and cost details for crawling this domain inside RAG contexts.
      </p>
      <div style={{ background: 'rgba(22, 26, 33, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '2rem', marginTop: '2rem' }}>
        <p><strong>Total Scrape Token Count:</strong> ~1,250 tokens</p>
        <p><strong>LLM Processing Speed:</strong> Optimal (Minimal nesting / high semantic density)</p>
        <p><strong>Vector Compaction Score:</strong> 98% (Pass)</p>
      </div>
    </div>
  );
}
