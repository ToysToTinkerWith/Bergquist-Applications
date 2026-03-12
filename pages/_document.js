import React from "react";
import Script from "next/script"
import Document, { Html, Head, Main, NextScript } from "next/document";
import theme from "../theme";

export default class MyDocument extends Document {

  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang="en">
        <Head>

        <Script type="application/ld+json">
        
         "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": "Analyzing Google Search traffic drops",
          "datePublished": "2021-07-20T08:00:00+08:00",
          "dateModified": "2021-07-20T09:20:00+08:00"
        
        </Script>
     
          <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
          <meta name="title" content="Bergquist Applications | Web & AI Solutions" />
          <meta name="description" content="Custom websites and AI integrations built for performance and purpose." />
          <meta name="keywords" content="Website, Web, Application, AI, Database, Payments" />

          <meta name="theme-color" content={theme.palette.primary.main} />

          <meta property="og:url" content="https://bergquistapplications.com/" key="ogurl" />
          <meta property="og:image" content="/spaceExp.png" key="ogimage" />
          <meta property="og:image:alt" content="" key="ogimagealt" />
          <meta property="og:title" content="Bergquist Applications | Web & AI Solutions" key="ogtitle" />
          <meta property="og:description" content="Custom websites and AI integrations built for performance and purpose." key="ogdesc" />
          
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
          />

          <link rel="icon" href="/images/favicon.ico"/>
          <link rel="shortcut icon" href="/images/favicon.ico"/>


          
          
        </Head>
        <body>

          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

