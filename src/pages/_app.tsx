import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Set CSS variables for Telegram theme
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--tg-theme-bg-color', '#000000');
      root.style.setProperty('--tg-theme-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-hint-color', '#888888');
      root.style.setProperty('--tg-theme-link-color', '#00ff00');
      root.style.setProperty('--tg-theme-button-color', '#00ff00');
      root.style.setProperty('--tg-theme-button-text-color', '#000000');
      root.style.setProperty('--tg-theme-header-bg-color', '#00ff00');
      root.style.setProperty('--tg-theme-accent-text-color', '#00ff00');
      
      // Add Telegram app data attribute
      document.documentElement.setAttribute('data-telegram-app', 'true');
      
      // Try to set body background
      document.body.style.backgroundColor = '#000000';
    }

    // Add cyberpunk visual effects
    const addCyberEffect = () => {
      const effect = document.createElement('div');
      effect.className = 'fixed inset-0 pointer-events-none z-50';
      effect.innerHTML = `
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-scan-line"></div>
      `;
      document.body.appendChild(effect);
    };

    addCyberEffect();
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#00ff00" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}