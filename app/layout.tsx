import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
export const metadata: Metadata = { title: 'The Secret Box', description: 'you are not alone' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{margin:0,padding:0,background:'#0a0a0a'}}>{children}<Analytics /></body></html>;
}
