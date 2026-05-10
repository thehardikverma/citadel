import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Citadel — Private Vault',
  description: 'Your encrypted personal vault. Passwords, notes, files — secured with zero-knowledge encryption.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
