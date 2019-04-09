import React from "react"
import PropTypes from "prop-types"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import Content, { HTMLContent } from "../components/Content"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGithub } from "@fortawesome/free-brands-svg-icons"
import { faTools } from "@fortawesome/free-solid-svg-icons"

export const ProjectPageTemplate = ({
  title,
  repository,
  uses,
  content,
  contentComponent,
}) => {
  const PageContent = contentComponent || Content

  return (
    <article className="h-entry mt-12 mb-10">
      <h2 className="p-name">{title}</h2>
      <div className="flex flex-row flex-wrap -mt-1 mb-1 text-sm text-purple-800">
        {repository && (
          <div>
            <a
              href={`https://github.com/${repository}`}
              className="text-purple-800 no-underline inline-flex items-center mr-2 py-1 px-2 mb-2 bg-purple-100 rounded border-solid border border-purple-200"
            >
              <FontAwesomeIcon icon={faGithub} />
              <span className="ml-2 text-xs">{repository}</span>
            </a>
          </div>
        )}
        {uses && uses.length > 0 && (
          <div className="inline-flex items-center rounded py-1 px-2 mb-2 bg-purple-100 border-solid border border-purple-200">
            <FontAwesomeIcon icon={faTools} />
            <span className="ml-2 text-xs">{uses.join(", ").toLowerCase()}</span>
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
