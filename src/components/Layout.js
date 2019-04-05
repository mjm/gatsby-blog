import React from "react";
import Helmet from "react-helmet";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import useSiteMetadata from "./SiteMetadata";

import "./all.css";

const TemplateWrapper = ({ children }) => {
  const {
    title,
    description,
    selfLinks,
    webmentionUsername
  } = useSiteMetadata();

  return (
    <div className="bg-white w-full min-h-screen mt-2 pb-12 text-indigo-900">
      <Helmet>
        <html lang="en" />
        <title>{title}</title>
        <meta name="description" content={description} />

        {selfLinks.map(href => (
          <link rel="me" href={href} key={href} />
        ))}
        <link rel="authorization_endpoint" href="https://indieauth.com/auth" />
        <link
          rel="webmention"
          href={`https://webmention.io/${webmentionUsername}/webmention`}
        />
        <link
          rel="pingback"
          href={`https://webmention.io/${webmentionUsername}/xmlrpc`}
        />

        <meta name="theme-color" content="#fff" />

        <meta property="og:type" content="business.business" />
        <meta property="og:title" content={title} />
        <meta property="og:url" content="/" />
        <meta property="og:image" content="/img/og-image.jpg" />
        <body className="bg-purple-600" />
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
