import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return new NextResponse('secretbox_indexnow_verification_key_5566', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
