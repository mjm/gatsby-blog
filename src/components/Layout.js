import React from "react";
import Helmet from "react-helmet";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import useSiteMetadata from "./SiteMetadata";

import "./all.css";

const TemplateWrapper = ({ children }) => {
  const { title, description } = useSiteMetadata();
  return (
    <div className="bg-white w-full min-h-screen mt-2 pb-12 text-indigo-900">
      <Helmet>
        <html lang="en" />
        <title>{title}</title>
        <meta name="description" content={description} />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/img/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          href="/img/favicon-32x32.png"
          sizes="32x32"
        />
        <link
          rel="icon"
          type="image/png"
          href="/img/favicon-16x16.png"
          sizes="16x16"
        />

        <link
          rel="mask-icon"
          href="/img/safari-pinned-tab.svg"
          color="#ff4400"
        />
        <meta name="theme-color" content="#fff" />

        <meta property="og:type" content="business.business" />
        <meta property="og:title" content={title} />
        <meta property="og:url" content="/" />
        <meta property="og:image" content="/img/og-image.jpg" />
      </Helmet>
      <div className="container mx-auto">
        <Header />
        <Navbar />
        <section className="max-w-lg mx-auto px-3 mt-6">{children}</section>
      </div>
    </div>
  );
};

export default TemplateWrapper;
