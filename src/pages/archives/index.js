import React from "react"
import { Link, graphql } from "gatsby"
import { orderBy } from "lodash"
import moment from "moment"
import Layout from "../../components/Layout"
import styles from "../../components/Blog.module.scss"

const ArchivesPage = ({ data }) => {
  const {
    allMarkdownRemark: { archivePages },
  } = data

  const pages = orderBy(archivePages, "fieldValue", "desc")

  return (
    <Layout>
      <section>
        <h2>Archives</h2>
        <ul className={styles.archives}>
          {pages.map(({ fieldValue, totalCount }) => (
            <li key={fieldValue}>
              <Link to={`/${fieldValue}/`}>{friendlyMonth(fieldValue)}</Link>{" "}
              <span className={styles.articleCount}>({totalCount})</span>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  )
}

function friendlyMonth(value) {
  return moment.utc(value, "YYYY/MM").format("MMMM Y")
}

export default ArchivesPage

export const pageQuery = graphql`
  query GetArchivePages {
    allMarkdownRemark(
      filter: {
        frontmatter: { templateKey: { in: ["blog-post", "microblog-post"] } }
      }
    ) {
      archivePages: group(field: fields___archivePage) {
        fieldValue
        totalCount
      }
    }
  }
`
