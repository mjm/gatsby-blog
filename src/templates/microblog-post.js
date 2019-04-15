import React from "react"
import PropTypes from "prop-types"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import Content, { HTMLContent } from "../components/Content"
import Mentions from "../components/Mentions"
import useSiteMetadata from "../components/SiteMetadata"
import DateBubble from "../components/DateBubble"
import styles from "../components/Blog.module.scss"

export const MicroblogPostTemplate = ({
  slug,
  content,
  contentComponent,
  date,
  isoDate,
  photos,
}) => {
  const { siteUrl } = useSiteMetadata()
  const url = slug && siteUrl + slug

  photos = photos || []
  const PostContent = contentComponent || Content

  return (
    <article className="h-entry">
      <PostContent className="p-name e-content" content={content} />
      {photos.map(photo => (
        <figure key={photo}>
          <img src={photo} alt="" className="u-photo" />
        </figure>
      ))}
      <div className={styles.footer}>
        <DateBubble isoDate={isoDate} className="dt-published">
          {date}
        </DateBubble>
      </div>
      <Mentions url={url} />
    </article>
  )
}

MicroblogPostTemplate.propTypes = {
  content: PropTypes.node.isRequired,
  contentComponent: PropTypes.func,
  date: PropTypes.string,
  isoDate: PropTypes.string,
  photos: PropTypes.array,
}

const MicroblogPost = ({ data }) => {
  const { markdownRemark: post } = data

  return (
    <Layout>
      <MicroblogPostTemplate
        slug={post.fields.slug}
        content={post.html}
        contentComponent={HTMLContent}
        date={post.frontmatter.date}
        isoDate={post.frontmatter.isoDate}
        photos={post.frontmatter.photos}
      />
    </Layout>
  )
}

MicroblogPost.propTypes = {
  data: PropTypes.shape({
    markdownRemark: PropTypes.object,
  }),
}

export default MicroblogPost

export const pageQuery = graphql`
  query MicroblogPostByID($id: String!) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      fields {
        slug
      }
      frontmatter {
        date(formatString: "MMM D, Y")
        isoDate: date(formatString: "YYYY-MM-DDTHH:mm:ssZ")
        photos
      }
    }
  }
`
