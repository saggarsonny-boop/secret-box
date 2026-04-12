import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function moderateImage(base64: string): Promise<{safe: boolean; reason: string}> {
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
    const data = await response.json();
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
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 });
    const base64 = image.split(',')[1];
    const { safe, reason } = await moderateImage(base64);
    if (!safe) {
      const messages: Record<string, string> = {
        faces: 'Images with recognizable faces are not allowed. This protects everyone\'s privacy and safety.',
        nudity: 'This image cannot be shared here. Please keep content appropriate for all ages.',
        violence: 'Images showing violence are not allowed. This is a safe space.',
        personal: 'Images showing personal information like names, numbers or emails are not allowed. Your safety matters.',
      };
      return NextResponse.json({ error: messages[reason] || 'Image not allowed' }, { status: 400 });
    }
    const result = await cloudinary.uploader.upload(image, {
      folder: 'secret-box',
      transformation: [{ width: 800, crop: 'limit' }, { quality: 'auto' }]
    });
    return NextResponse.json({ url: result.secure_url });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
