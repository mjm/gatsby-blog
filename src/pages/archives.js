import React from "react"
import { Link, graphql } from "gatsby"
import { orderBy, groupBy } from "lodash"
import moment from "moment"
import Layout from "../components/Layout"
import styles from "../components/Blog.module.scss"
import { Helmet } from "react-helmet"

const ArchivesPage = ({ data }) => {
  const {
    allMarkdownRemark: { archivePages },
  } = data

  const pages = orderBy(archivePages, "fieldValue", "desc")
  const groups = orderBy(
    Object.entries(groupBy(pages, p => p.fieldValue.substring(0, 4))),
    entry => entry[0],
    "desc"
  )

  return (
    <Layout>
      <Helmet>
        <title>Archives</title>
      </Helmet>
      <section>
        <h2>Archives</h2>
        {groups.map(([year, pages]) => (
          <section key={year}>
            <h3 className={styles.archiveYear}>{year}</h3>
            <ul className={styles.archives}>
              {pages.map(({ fieldValue, totalCount }) => (
                <li key={fieldValue}>
                  <Link to={`/${fieldValue}/`}>
                    {friendlyMonth(fieldValue)}
                  </Link>{" "}
                  <span className={styles.articleCount}>({totalCount})</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
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
