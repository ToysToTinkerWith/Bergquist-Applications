import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {

  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang="en">
        <Head>

          
          <link rel="preload" as="font" type="font/woff2" href="/fonts/outfit-latin.woff2" crossOrigin="anonymous" />

          <link rel="icon" type="image/png" sizes="96x96" href="/brand/favicon-96.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png" />


          
          
        </Head>
        <body>

          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

