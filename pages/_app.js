// pages/_app.js
import Head from 'next/head';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { CartProvider } from '../lib/CartContext';

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
      <SpeedInsights />
    </CartProvider>
  );
}
