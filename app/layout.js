import './globals.css';
import { DM_Sans, Instrument_Serif } from 'next/font/google';
import { EVENT } from '@/lib/event-config';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: '400',
  style: ['normal', 'italic'],
});

export const metadata = {
  title: EVENT.appName,
  description: `Electronic waiver packet for ${EVENT.eventName}`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
