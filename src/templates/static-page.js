import React from "react"
import PropTypes from "prop-types"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import Content, { HTMLContent } from "../components/Content"

export const StaticPageTemplate = ({ title, content, contentComponent }) => {
  const PageContent = contentComponent || Content

  return (
    <article className="h-entry mt-12 mb-10">
      <h2 className="p-name">{title}</h2>
      <PageContent className="e-content" content={content} />
    </article>
  )
}

StaticPageTemplate.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.string,
  contentComponent: PropTypes.func,
}

const StaticPage = ({ data }) => {
  const { markdownRemark: post } = data

  return (
    <Layout>
      <StaticPageTemplate
        contentComponent={HTMLContent}
        title={post.frontmatter.title}
        content={post.html}
      />
    </Layout>
  )
}

StaticPage.propTypes = {
  data: PropTypes.object.isRequired,
}

export default StaticPage

export const aboutPageQuery = graphql`
  query StaticPage($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
      }
    }
  }
`
