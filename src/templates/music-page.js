import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import Content, { HTMLContent } from "../components/Content"
import styles from "../components/Music.module.scss"
import { Helmet } from "react-helmet"

export const MusicPageTemplate = ({
  title,
  content,
  contentComponent,
  albums,
}) => {
  const PageContent = contentComponent || Content

  return (
    <article className="h-entry">
      <h2 className="p-name">{title}</h2>
      <div className="e-content">
        <PageContent content={content} />
        <div className={styles.albums}>
          {albums.map(album => (
            <div key={`${album.name}-${album.artist}`} className={styles.album}>
              <div>
                <a href={album.url}>
                  <img
                    src={`${album.image}?nf_resize=fit&w=300&h=300`}
                    alt={`${album.name} - ${album.artist}`}
                  />
                </a>
              </div>
              <div>
                <em>{album.name}</em>
              </div>
              <div className={styles.artist}>{album.artist}</div>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

const MusicPage = ({ data }) => {
  const { markdownRemark: post } = data

  return (
    <Layout>
      <Helmet>
        <title>{post.frontmatter.title}</title>
      </Helmet>
      <MusicPageTemplate
        contentComponent={HTMLContent}
        title={post.frontmatter.title}
        content={post.html}
        albums={post.frontmatter.albums}
      />
    </Layout>
  )
}

export default MusicPage

export const pageQuery = graphql`
  query MusicPage($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
        albums {
          name
          artist
          url
          image
        }
      }
    }
  }
`
