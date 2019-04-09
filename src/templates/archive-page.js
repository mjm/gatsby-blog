import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import BlogRoll from "../components/BlogRoll"

const ArchivePage = ({ data }) => {
  const {
    allMarkdownRemark: { edges },
  } = data

  return (
    <Layout>
      <BlogRoll posts={edges} />
    </Layout>
  )
}

export default ArchivePage

export const pageQuery = graphql`
  query GetArchivedPosts($dateStart: Date!, $dateEnd: Date!) {
    allMarkdownRemark(
      filter: {
        frontmatter: {
          date: { gte: $dateStart, lte: $dateEnd }
          templateKey: { in: ["blog-post", "microblog-post"] }
        }
      }
      sort: { fields: [frontmatter___date], order: [DESC] }
    ) {
      edges {
        node {
          excerpt(pruneLength: 400)
          id
          html
          fields {
            slug
          }
          frontmatter {
            title
            templateKey
            date(formatString: "MMM D, Y")
            isoDate: date(formatString: "YYYY-MM-DDTHH:mm:ssZ")
            photos
          }
        }
      }
    }
  }
`
