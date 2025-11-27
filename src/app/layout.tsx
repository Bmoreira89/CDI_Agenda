import './globals.css';

export const metadata = { title: 'CDI Agenda' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body style={{ fontFamily: 'Inter, system-ui, Arial' }}>{children}</body>
    </html>
  );
}
