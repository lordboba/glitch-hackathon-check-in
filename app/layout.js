import './globals.css';
import { EVENT } from '@/lib/event-config';

export const metadata = {
  title: EVENT.appName,
  description: `Electronic waiver packet for ${EVENT.eventName}`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
