export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getOrCreateSessionToken } from '@/lib/session';
import { verifyTurnstile } from '@/lib/turnstile';
import { isOverCap, recordSpend, estimateAnthropicCents } from '@/lib/cost-cap';
import { ipFromHeaders } from '@/lib/geo';

async function sha1(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function moderateImage(base64: string): Promise<{safe: boolean; reason: string}> {
  if (await isOverCap('anthropic')) return { safe: true, reason: '' };
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: 'Does this image contain any of these: (1) recognizable human faces, (2) nudity or sexual content, (3) violence or gore, (4) text showing personal information like names, phone numbers or emails? Reply with only one word: FACES, NUDITY, VIOLENCE, PERSONAL, or SAFE.' }
          ]
        }]
      })
    });
    const data = await response.json() as { content: { text: string }[]; usage?: { input_tokens: number; output_tokens: number } };
    if (data.usage) {
      await recordSpend(estimateAnthropicCents(data.usage.input_tokens, data.usage.output_tokens));
    }
    const answer = data.content[0].text.trim().toUpperCase();
    if (answer === 'SAFE') return { safe: true, reason: '' };
    if (answer === 'FACES') return { safe: false, reason: 'faces' };
    if (answer === 'NUDITY') return { safe: false, reason: 'nudity' };
    if (answer === 'VIOLENCE') return { safe: false, reason: 'violence' };
    if (answer === 'PERSONAL') return { safe: false, reason: 'personal' };
    return { safe: true, reason: '' };
  } catch {
    return { safe: true, reason: '' };
  }
}

export async function POST(req: Request) {
  try {
    const { image, turnstile_token } = await req.json() as { image?: string; turnstile_token?: string };
    if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const ip = ipFromHeaders(req.headers);
    const ts = await verifyTurnstile(turnstile_token, ip);
    if (!ts.ok) return NextResponse.json({ error: 'captcha_failed' }, { status: 400 });

    await getOrCreateSessionToken();

    const base64 = image.split(',')[1];
    const { safe, reason } = await moderateImage(base64);
    if (!safe) {
      const messages: Record<string, string> = {
        faces: "Images with recognizable faces are not allowed. This protects everyone's privacy and safety.",
        nudity: "This image cannot be shared here. Please keep content appropriate for all ages.",
        violence: "Images showing violence are not allowed. This is a safe space.",
        personal: "Images showing personal information like names, numbers or emails are not allowed. Your safety matters.",
      };
      return NextResponse.json({ error: messages[reason] || 'Image not allowed' }, { status: 400 });
    }

    // Direct REST API Upload to Cloudinary (Edge compatible)
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const folder = 'secret-box';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';

    // Generate SHA-1 signature of parameters (sorted alphabetically)
    const paramString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = await sha1(paramString);

    const formData = new FormData();
    formData.append("file", image);
    formData.append("folder", folder);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData
    });

    if (!uploadRes.ok) {
      console.error("Cloudinary upload failed:", await uploadRes.text());
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const result = await uploadRes.json() as { secure_url: string };
    return NextResponse.json({ url: result.secure_url });
  } catch (e) {
    console.error("Upload API error:", e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
