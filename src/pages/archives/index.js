import React from "react"
import { Link, graphql } from "gatsby"
import { orderBy } from "lodash"
import moment from "moment"
import Layout from "../../components/Layout"

const ArchivesPage = ({ data }) => {
  const {
    allMarkdownRemark: { archivePages },
  } = data

  const pages = orderBy(archivePages, "fieldValue", "desc")

  return (
    <Layout>
      <section className="mt-8 mb-10">
        <h1>Archives</h1>
        <ul className="list-none m-0">
          {pages.map(({ fieldValue, totalCount }) => (
            <li key={fieldValue}>
              <Link to={`/${fieldValue}/`} className="text-purple-700">
                {friendlyMonth(fieldValue)}
              </Link>{" "}
              <span className="text-sm text-purple-400">({totalCount})</span>
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
