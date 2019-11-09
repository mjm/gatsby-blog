const _ = require("lodash")
const path = require("path")
const { createFilePath } = require("gatsby-source-filesystem")

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions

  return graphql(`
    {
      allMarkdownRemark(limit: 1000) {
        edges {
          node {
            id
            fields {
              slug
              archivePage
            }
            frontmatter {
              templateKey
              series
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      result.errors.forEach(e => console.error(e.toString()))
      return Promise.reject(result.errors)
    }

    const posts = result.data.allMarkdownRemark.edges
    const archivePages = new Set()

    posts.forEach(edge => {
      if (edge.node.fields.archivePage) {
        archivePages.add(edge.node.fields.archivePage)
      }

      const id = edge.node.id
      const series = edge.node.frontmatter.series
      createPage({
        path: edge.node.fields.slug,
        component: path.resolve(
          `src/templates/${String(edge.node.frontmatter.templateKey)}.js`
        ),
        // additional data can be passed via context
        context: {
          id,
          series,
        },
      })
    })

    const archivePageComponent = path.resolve("src/templates/archive-page.js")
    for (const archivePage of archivePages) {
      const [year, month] = archivePage.split("/")

      createPage({
        path: archivePage,
        component: archivePageComponent,
        context: {
          dateStart: `${year}-${month}-00`,
          dateEnd: `${year}-${month}-99`,
        },
      })
    }
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const templateKey = node.frontmatter.templateKey || ""
    let basePath = ""
    if (templateKey === "blog-post") {
      basePath = "blog"
    } else if (templateKey === "microblog-post") {
      basePath = "micro"
    }
    const slug = createFilePath({ node, getNode, basePath })
    createNodeField({
      name: `slug`,
      node,
      value: slug,
    })

    const date = node.frontmatter.date
    if (date) {
      const archivePage = date.substring(0, 7).replace("-", "/")
      createNodeField({
        name: "archivePage",
        node,
        value: archivePage,
      })
    }
  }
}
