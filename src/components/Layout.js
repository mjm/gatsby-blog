import React from "react"
import Helmet from "react-helmet"
import Header from "../components/Header"
import Navbar from "../components/Navbar"
import useSiteMetadata from "./SiteMetadata"

import "typeface-eczar"
import "typeface-gentium-basic"
import "./all.scss"
import styles from "./Layout.module.scss"

const TemplateWrapper = ({ children }) => {
  const {
    title,
    description,
    siteUrl,
    selfLinks,
    webmentionUsername,
  } = useSiteMetadata()

  return (
    <div className={styles.outer}>
      <Helmet>
        <html lang="en" />
        <title>{title}</title>
        <meta name="description" content={description} />

        {selfLinks.map(href => (
          <link rel="me" href={href} key={href} />
        ))}
        <link rel="authorization_endpoint" href="https://indieauth.com/auth" />
        <link rel="token_endpoint" href="https://tokens.indieauth.com/token" />
        <link rel="micropub" href={`${siteUrl}/.netlify/functions/micropub`} />
        <link
          rel="webmention"
          href={`https://webmention.io/${webmentionUsername}/webmention`}
        />
        <link
          rel="pingback"
          href={`https://webmention.io/${webmentionUsername}/xmlrpc`}
        />

        <meta name="theme-color" content="#fff" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:url" content="/" />
        <meta property="og:site_name" content={title} />
        <meta
          property="og:image"
          content="https://gravatar.com/avatar/fe0af3575ea6c1fa7881a17aaf72c510"
        />
        <body className={styles.body} />
      </Helmet>
      <div className={styles.inner}>
        <Header />
        <Navbar />
        <section className={styles.main}>{children}</section>
      </div>
    </div>
  )
}

export default TemplateWrapper
