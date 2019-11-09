import React from "react"
import PropTypes from "prop-types"
import Helmet from "react-helmet"
import { graphql, Link } from "gatsby"
import Layout from "../components/Layout"
import Content, { HTMLContent } from "../components/Content"
import Mentions from "../components/Mentions"
import useSiteMetadata from "../components/SiteMetadata"
import DateBubble from "../components/DateBubble"
import styles from "../components/Blog.module.scss"
import { Syndication } from "../components/Syndication"

export const BlogPostTemplate = ({
  slug,
  content,
  contentComponent,
  tableOfContents,
  series,
  date,
  helmet,
  isoDate,
  syndication,
  title,
}) => {
  const { siteUrl } = useSiteMetadata()
  const url = slug && siteUrl + slug

  const PostContent = contentComponent || Content

  return (
    <article className="h-entry">
      {helmet || ""}
      <h1 className="p-name">{title}</h1>
      {series.parts.length ? (
        <blockquote className={styles.series}>
          <p>This article is part of a series on {series.about}:</p>
          <ul>
            {series.parts.map((part, index) => (
              <li key={part.fields.slug}>
                {part.fields.slug === slug ? (
                  <>
                    Part {index + 1}: {part.frontmatter.title}
                  </>
                ) : (
                  <Link to={part.fields.slug}>
                    Part {index + 1}: {part.frontmatter.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </blockquote>
      ) : null}
      <div
        className={styles.tableOfContents}
        dangerouslySetInnerHTML={{ __html: tableOfContents }}
      />
      <div className="e-content">
        <PostContent content={content} />
      </div>
      <div className={styles.footer}>
        <DateBubble isoDate={isoDate} className="dt-published">
          {date}
        </DateBubble>
      </div>
      <Syndication urls={syndication} />
      <Mentions url={url} />
    </article>
  )
}

BlogPostTemplate.propTypes = {
  content: PropTypes.node.isRequired,
  contentComponent: PropTypes.func,
  tableOfContents: PropTypes.string,
  series: PropTypes.object,
  date: PropTypes.string,
  helmet: PropTypes.object,
  isoDate: PropTypes.string,
  title: PropTypes.string,
  syndication: PropTypes.arrayOf(PropTypes.string),
}

const BlogPost = ({ data }) => {
  const { markdownRemark: post, series } = data

  return (
    <Layout>
      <BlogPostTemplate
        slug={post.fields.slug}
        content={post.html}
        contentComponent={HTMLContent}
        tableOfContents={post.tableOfContents}
        series={{ about: post.frontmatter.series, parts: series.nodes }}
        date={post.frontmatter.date}
        helmet={
          <Helmet>
            <title>{post.frontmatter.title}</title>
            <meta property="og:title" content={post.frontmatter.title} />
            <meta property="og:url" content={post.fields.slug} />
          </Helmet>
        }
        isoDate={post.frontmatter.isoDate}
        title={post.frontmatter.title}
        syndication={post.frontmatter.syndication}
      />
    </Layout>
  )
}

BlogPost.propTypes = {
  data: PropTypes.shape({
    markdownRemark: PropTypes.object,
    series: PropTypes.object,
  }),
}

export default BlogPost

export const pageQuery = graphql`
  query BlogPostByID($id: String!, $series: String) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      tableOfContents
      fields {
        slug
      }
      frontmatter {
        date(formatString: "MMM D, Y")
        isoDate: date(formatString: "YYYY-MM-DDTHH:mm:ssZ")
        title
        syndication
        series
      }
    }

    series: allMarkdownRemark(
      filter: { frontmatter: { series: { eq: $series, nin: [null] } } }
      sort: { fields: frontmatter___date, order: ASC }
    ) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
        }
      }
    }
  }
`
