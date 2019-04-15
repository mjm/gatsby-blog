import React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/Layout"
import BlogRoll from "../components/BlogRoll"
import styles from "../components/Blog.module.scss"

const IndexPage = ({ data }) => {
  const {
    allMarkdownRemark: { edges },
  } = data

  return (
    <Layout>
      <BlogRoll posts={edges} />
      <div className={styles.seeMore}>
        <p>
          See more posts in the <Link to="/archives/">archives</Link>.
        </p>
      </div>
    </Layout>
  )
}

export default IndexPage

export const pageQuery = graphql`
  query IndexQuery {
    allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___date] }
      filter: {
        frontmatter: { templateKey: { in: ["blog-post", "microblog-post"] } }
      }
      limit: 30
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
