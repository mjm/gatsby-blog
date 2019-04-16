const path = require("path")
const fs = require("fs")
const Feed = require("feed").Feed
const publicPath = "./public"

const query = `
  {
    site {
      siteMetadata {
        title
        description
        siteUrl
      }
    }
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
`

exports.onPostBuild = async ({ graphql }, pluginOptions) => {
  const { data } = await graphql(query)
  const { site, allMarkdownRemark } = data

  const feed = new Feed({
    title: site.siteMetadata.title,
    description: site.siteMetadata.description,
    id: site.siteMetadata.siteUrl,
    link: site.siteMetadata.siteUrl,
    generator: "gatsby-plugin-json-feed",
    feedLinks: {
      json: `${site.siteMetadata.siteUrl}/feed.json`,
    },
  })

  allMarkdownRemark.edges.forEach(({ node: post }) => {
    const url = `${site.siteMetadata.siteUrl}${post.fields.slug}`
    feed.addItem({
      title: post.frontmatter.title,
      id: url,
      link: url,
      description: post.excerpt,
      date: new Date(post.frontmatter.date),
      content: post.html,
    })
  })

  const outputPath = path.join(publicPath, "feed.json")

  return new Promise((yay, nah) => {
    fs.writeFile(outputPath, feed.json1(), err => (err ? nah(err) : yay()))
  })
}
