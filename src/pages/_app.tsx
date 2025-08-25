import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Set CSS variables for Telegram theme with VNVNC colors
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--tg-theme-bg-color', '#000000');
      root.style.setProperty('--tg-theme-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-hint-color', '#888888');
      root.style.setProperty('--tg-theme-link-color', '#DC2626');
      root.style.setProperty('--tg-theme-button-color', '#DC2626');
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-header-bg-color', '#DC2626');
      root.style.setProperty('--tg-theme-accent-text-color', '#DC2626');
      
      // Add Telegram app data attribute
      document.documentElement.setAttribute('data-telegram-app', 'true');
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#DC2626" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}