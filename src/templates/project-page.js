import React from "react"
import PropTypes from "prop-types"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import Content, { HTMLContent } from "../components/Content"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGithub } from "@fortawesome/free-brands-svg-icons"
import { faTools } from "@fortawesome/free-solid-svg-icons"
import styles from "../components/Project.module.scss"
import { Helmet } from "react-helmet";

export const ProjectPageTemplate = ({
  title,
  repository,
  uses,
  content,
  contentComponent,
}) => {
  const PageContent = contentComponent || Content

  return (
    <article className="h-entry">
      <h2 className="p-name">{title}</h2>
      <div className={styles.metadata}>
        {repository && (
          <div>
            <a
              href={`https://github.com/${repository}`}
              className={styles.repository}
            >
              <FontAwesomeIcon icon={faGithub} />
              <span className={styles.label}>{repository}</span>
            </a>
          </div>
        )}
        {uses && uses.length > 0 && (
          <div className={styles.uses}>
            <FontAwesomeIcon icon={faTools} />
            <span className={styles.label}>
              {uses.join(", ").toLowerCase()}
            </span>
          </div>
        )}
      </div>
      <PageContent className="e-content" content={content} />
    </article>
  )
}

ProjectPageTemplate.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.string,
  contentComponent: PropTypes.func,
}

const ProjectPage = ({ data }) => {
  const { markdownRemark: post } = data

  return (
    <Layout>
      <Helmet>
        <title>{post.frontmatter.title}</title>
      </Helmet>
      <ProjectPageTemplate
        contentComponent={HTMLContent}
        title={post.frontmatter.title}
        repository={post.frontmatter.repository}
        uses={post.frontmatter.uses}
        content={post.html}
      />
    </Layout>
  )
}

ProjectPage.propTypes = {
  data: PropTypes.object.isRequired,
}

export default ProjectPage

export const aboutPageQuery = graphql`
  query ProjectPage($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
        repository
        uses
      }
    }
  }
`
