module.exports = {
  siteMetadata: {
    title: "Matt Moriarity",
    description: "Matt's personal blog",
    siteUrl: "https://www.mattmoriarity.com",
    selfLinks: [
      "https://github.com/mjm",
      "mailto:matt@mattmoriarity.com",
      "https://instagram.com/mjmoriarity",
    ],
    webmentionUsername: "www.mattmoriarity.com",
  },
  plugins: [
    "gatsby-plugin-react-helmet",
    "gatsby-plugin-netlify-cache",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        path: `${__dirname}/src/pages`,
        name: "pages",
      },
    },
    {
      resolve: "gatsby-transformer-remark",
      options: {
        excerpt_separator: "<!--more-->",
        plugins: [
          {
            resolve: "gatsby-remark-copy-linked-files",
            options: {
              destinationDir: "static",
            },
          },
          "gatsby-remark-autolink-headers",
          "gatsby-remark-embed-snippet",
          {
            resolve: `@raae/gatsby-remark-oembed`,
            options: {
              providers: {
                include: ["Instagram", "Twitter", "YouTube"],
              },
            },
          },
          {
            resolve: "gatsby-remark-prismjs",
            options: {
              noInlineHighlight: true,
            },
          },
          "gatsby-remark-smartypants",
          {
            resolve: "gatsby-remark-microformats",
            options: {
              baseURL: "https://www.mattmoriarity.com",
            },
          },
        ],
      },
    },
    "gatsby-transformer-yaml",
    "gatsby-plugin-force-trailing-slashes",
    "gatsby-plugin-catch-links",
    {
      resolve: "@jamesdanylik/gatsby-source-goodreads",
      options: {
        key: process.env.GOODREADS_API_KEY,
        id: "96331589",
      },
    },
    {
      resolve: "gatsby-plugin-feed",
      options: {
        feeds: [
          {
            query: `
              {
                allMarkdownRemark(
                  filter: {
                    frontmatter: {
                      templateKey: { in: ["blog-post", "microblog-post"] }
                    }
                  },
                  sort: { order: DESC, fields: [frontmatter___date] },
                  limit: 20,
                ) {
                  edges {
                    node {
                      excerpt
                      html
                      fields { slug }
                      frontmatter {
                        title
                        date
                      }
                    }
                  }
                }
              }
            `,
            serialize({ query: { site, allMarkdownRemark } }) {
              return allMarkdownRemark.edges.map(({ node }) => {
                const url = site.siteMetadata.siteUrl + node.fields.slug
                const item = {
                  title: node.frontmatter.title,
                  date: node.frontmatter.date,
                  description: node.excerpt,
                  url,
                  guid: url,
                  custom_elements: [{ "content:encoded": node.html }],
                }
                return item
              })
            },
            output: "/feed.xml",
            title: "Matt Moriarity",
          },
        ],
      },
    },
    "gatsby-plugin-json-feed",
    {
      resolve: "gatsby-plugin-sass",
      options: {
        implementation: require("sass"),
      },
    },
    {
      resolve: "gatsby-plugin-typography",
      options: {
        pathToConfigModule: "src/utils/typography",
        omitGoogleFont: true,
      },
    },
    "gatsby-plugin-netlify", // make sure to keep it last in the array
  ],
}
