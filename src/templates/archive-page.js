import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import BlogRoll from "../components/BlogRoll"
import { Helmet } from "react-helmet"
import moment from "moment"
import styles from "../components/Blog.module.scss"

const ArchivePage = ({ data, pageContext }) => {
  const { dateStart } = pageContext
  const title = moment.utc(dateStart, "YYYY-MM").format("MMMM Y")

  const {
    allMarkdownRemark: { edges },
  } = data

  return (
    <Layout>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <h2 className={styles.archiveTitle}>{title}</h2>
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
          excerpt(pruneLength: 400, format: HTML)
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
