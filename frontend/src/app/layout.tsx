import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bharat Market Intelligence | AI-Powered Indian Stock Intelligence Platform',
  description: 'Enterprise AI & Quantitative Analytics for NSE/BSE Equities, F&O, Black-Scholes Greeks, Backtesting, and Paper Trading.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-terminal-dark text-terminal-text antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
