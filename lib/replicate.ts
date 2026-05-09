// Replicate FLUX schnell wrapper. Free tier; FREE_OVER_PAID.
// Returns null on any failure — caller must handle the absence gracefully.

const MODEL = 'black-forest-labs/flux-schnell';

export async function generateSecretImage(prompt: string): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;
  try {
    const styled = `muted painterly evocative illustration, soft impressionist brushwork, atmospheric lighting, ${prompt}, abstract emotional landscape, no faces, no text, no people, no graphic content, gentle muted earth tones`;
    const create = await fetch('https://api.replicate.com/v1/models/' + MODEL + '/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60'
      },
      body: JSON.stringify({
        input: {
          prompt: styled,
          num_outputs: 1,
          aspect_ratio: '1:1',
          output_format: 'webp',
          output_quality: 80,
          go_fast: true,
          megapixels: '1',
          disable_safety_checker: false
        }
      })
    });
    if (!create.ok) return null;
    const data = await create.json() as { output?: string | string[]; status?: string; urls?: { get: string } };
    if (Array.isArray(data.output) && data.output[0]) return data.output[0];
    if (typeof data.output === 'string') return data.output;
    if (data.status === 'succeeded') return null;
    if (data.urls?.get) return await pollPrediction(data.urls.get, token);
    return null;
  } catch {
    return null;
  }
}

async function pollPrediction(url: string, token: string): Promise<string | null> {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json() as { status: string; output?: string | string[] };
      if (data.status === 'succeeded') {
        if (Array.isArray(data.output) && data.output[0]) return data.output[0];
        if (typeof data.output === 'string') return data.output;
        return null;
      }
      if (data.status === 'failed' || data.status === 'canceled') return null;
    } catch {
      return null;
    }
  }
  return null;
}

export function moodToImagePrompt(content: string, mood: string): string {
  const moodHints: Record<string, string> = {
    hollow: 'empty room with single distant window, faded grey-blue palette',
    anxious: 'tangled threads of warm amber against shadowed cool tones',
    hopeful: 'first light over still water, dawn pinks and pale gold',
    numb: 'snow on grey stone, monochrome, soft falling flakes',
    ashamed: 'curtain half-drawn over warm room, sepia and burgundy',
    seen: 'small candle in vast dark, golden glow, intimate scale',
    grief: 'rain on a still pond, slate blues, gentle ripples',
    love: 'two paths converging on a horizon, warm peach and rose',
    lonely: 'distant city lights through fog, deep blues',
    angry: 'storm clouds over still landscape, charcoal and copper',
    lost: 'forest path disappearing into mist, mossy greens',
    grateful: 'sunlight through autumn leaves, amber and ochre',
    trapped: 'narrow corridor opening to wide sky, slate and gold',
    invisible: 'ghost of a figure in foggy garden, washed pastels',
    broken: 'kintsugi pottery, gold veins through clay, muted backdrop',
    healing: 'green shoot through cracked earth, soft greens and warm browns'
  };
  const hint = moodHints[mood] || 'soft atmospheric landscape, muted earth tones';
  const safeContent = content.slice(0, 80).replace(/[^a-zA-Z0-9 ,.-]/g, '');
  return `${hint}, evoking the feeling of: ${safeContent}`;
}
