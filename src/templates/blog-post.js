import React from "react"
import PropTypes from "prop-types"
import Helmet from "react-helmet"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import Content, { HTMLContent } from "../components/Content"
import Mentions from "../components/Mentions"
import useSiteMetadata from "../components/SiteMetadata"
import DateBubble from "../components/DateBubble"
import styles from "../components/Blog.module.scss"

export const BlogPostTemplate = ({
  slug,
  content,
  contentComponent,
  date,
  helmet,
  isoDate,
  title,
}) => {
  const { siteUrl } = useSiteMetadata()
  const url = slug && siteUrl + slug

  const PostContent = contentComponent || Content

  return (
    <article className="h-entry">
      {helmet || ""}
      <h1 className="p-name">{title}</h1>
      <div className="e-content">
        <PostContent content={content} />
      </div>
      <div className={styles.footer}>
        <DateBubble isoDate={isoDate} className="dt-published">
          {date}
        </DateBubble>
      </div>
      <Mentions url={url} />
    </article>
  )
}

BlogPostTemplate.propTypes = {
  content: PropTypes.node.isRequired,
  contentComponent: PropTypes.func,
  date: PropTypes.string,
  helmet: PropTypes.object,
  isoDate: PropTypes.string,
  title: PropTypes.string,
}

const BlogPost = ({ data }) => {
  const { markdownRemark: post } = data

  return (
    <Layout>
      <BlogPostTemplate
        slug={post.fields.slug}
        content={post.html}
        contentComponent={HTMLContent}
        date={post.frontmatter.date}
        helmet={
          <Helmet titleTemplate="%s | Blog">
            <title>{post.frontmatter.title}</title>
          </Helmet>
        }
        isoDate={post.frontmatter.isoDate}
        title={post.frontmatter.title}
      />
    </Layout>
  )
}

BlogPost.propTypes = {
  data: PropTypes.shape({
    markdownRemark: PropTypes.object,
  }),
}

export default BlogPost

export const pageQuery = graphql`
  query BlogPostByID($id: String!) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      fields {
        slug
      }
      frontmatter {
        date(formatString: "MMM D, Y")
        isoDate: date(formatString: "YYYY-MM-DDTHH:mm:ssZ")
        title
      }
    }
  }
`
