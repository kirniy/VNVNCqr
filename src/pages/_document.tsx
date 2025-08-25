import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#00ff00" />
        <meta name="tg-theme-color" content="#00ff00" />
        <meta name="telegram-web-app-header-color" content="#00ff00" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <body className="bg-cyber-black text-cyber-green">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}