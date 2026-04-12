import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function moderateImage(base64: string): Promise<boolean> {
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
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: 'Does this image contain nudity, violence, gore, or explicitly inappropriate content? Reply only YES or NO.' }
          ]
        }]
      })
    });
    const data = await response.json();
    const answer = data.content[0].text.trim().toUpperCase();
    return answer === 'NO';
  } catch {
    return true;
  }
}

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 });
    const base64 = image.split(',')[1];
    const safe = await moderateImage(base64);
    if (!safe) return NextResponse.json({ error: 'Image not allowed' }, { status: 400 });
    const result = await cloudinary.uploader.upload(image, {
      folder: 'secret-box',
      transformation: [{ width: 800, crop: 'limit' }, { quality: 'auto' }]
    });
    return NextResponse.json({ url: result.secure_url });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
