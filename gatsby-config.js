var proxy = require("http-proxy-middleware");

module.exports = {
  siteMetadata: {
    title: "Matt Moriarity",
    description: "Matt's personal blog",
    siteUrl: "https://www.mattmoriarity.com",
    selfLinks: ["https://github.com/mjm", "mailto:matt@mattmoriarity.com"],
    webmentionUsername: "mattmoriarity.com"
  },
  plugins: [
    "gatsby-plugin-react-helmet",
    "gatsby-plugin-netlify-cache",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        path: `${__dirname}/src/pages`,
        name: "pages"
      }
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        path: `${__dirname}/src/img`,
        name: "images"
      }
    },
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-copy-linked-files",
            options: {
              destinationDir: "static"
            }
          },
          {
            resolve: `@raae/gatsby-remark-oembed`,
            options: {
              providers: {
                include: ["Instagram", "Twitter", "YouTube"]
              }
            }
          },
          {
            resolve: "gatsby-remark-prismjs"
          }
        ]
      }
    },
    {
      resolve: "gatsby-plugin-netlify-cms",
      options: {
        modulePath: `${__dirname}/src/cms/cms.js`
      }
    },
    "gatsby-plugin-force-trailing-slashes",
    "gatsby-plugin-catch-links",
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
                const url = site.siteMetadata.siteUrl + node.fields.slug;
                const item = {
                  title: node.frontmatter.title,
                  date: node.frontmatter.date,
                  description: node.excerpt,
                  url,
                  guid: url,
                  custom_elements: [{ "content:encoded": node.html }]
                };
                return item;
              });
            },
            output: "/feed.xml",
            title: "Matt Moriarity"
          }
        ]
      }
    },
    "gatsby-plugin-postcss",
    {
      resolve: "gatsby-plugin-typography",
      options: {
        pathToConfigModule: "src/utils/typography"
      }
    },
    {
      resolve: "gatsby-plugin-purgecss", // purges all unused/unreferenced css rules
      options: {
        develop: true, // Activates purging in npm run develop
        tailwind: true,
        purgeOnly: ['/all.css']
      }
    }, // must be after other CSS plugins
    "gatsby-plugin-netlify" // make sure to keep it last in the array
  ],
  // for avoiding CORS while developing Netlify Functions locally
  // read more: https://www.gatsbyjs.org/docs/api-proxy/#advanced-proxying
  developMiddleware: app => {
    app.use(
      "/.netlify/functions/",
      proxy({
        target: "http://localhost:9000",
        pathRewrite: {
          "/.netlify/functions/": ""
        }
      })
    );
  }
};
