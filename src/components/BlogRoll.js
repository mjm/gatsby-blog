import React, { useEffect, useState } from "react"
import { Link } from "gatsby"
import { HTMLContent } from "./Content"
import useSiteMetadata from "./SiteMetadata"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faComment } from "@fortawesome/free-solid-svg-icons"
import { DateBubbleLink } from "./DateBubble"
import styles from "./Blog.module.scss"

const BlogRoll = ({ posts }) => {
  const { siteUrl } = useSiteMetadata()

  return (
    <div className="h-feed">
      {posts &&
        posts.map(({ node: post }) => (
          <BlogRollEntry key={post.id} post={post} siteUrl={siteUrl} />
        ))}
    </div>
  )
}

const BlogRollEntry = ({ siteUrl, post }) => {
  const entryUrl = siteUrl + post.fields.slug

  const [mentionCount, setMentionCount] = useState(0)
  useEffect(() => {
    loadMentionCount()
  }, [entryUrl])

  async function loadMentionCount() {
    const search = new URLSearchParams({ target: entryUrl })
    const fetchUrl = `https://webmention.io/api/count?${search.toString()}`

    const response = await fetch(fetchUrl)
    const responseJson = await response.json()

    setMentionCount(responseJson.count)
  }

  const photos = post.frontmatter.photos || []

  return (
    <div>
      <article className="h-entry">
        {post.frontmatter.title && (
          <h1 className="p-name">
            <Link className={styles.title} to={post.fields.slug}>
              {post.frontmatter.title}
            </Link>
          </h1>
        )}
        {post.frontmatter.title ? (
          <HTMLContent className="e-content" content={post.excerpt} />
        ) : (
          <HTMLContent className="e-content" content={post.html} />
        )}
        {photos.map(photo => (
          <figure key={photo}>
            <img src={photo} alt="" className="u-photo" />
          </figure>
        ))}
        <div className={styles.footer}>
          {mentionCount > 0 && (
            <div className={styles.mentionCount}>
              <FontAwesomeIcon icon={faComment} />
              {mentionCount}
            </div>
          )}
          <DateBubbleLink
            to={post.fields.slug}
            linkClassName="u-url"
            className="dt-published"
            isoDate={post.frontmatter.isoDate}
          >
            {post.frontmatter.date}
          </DateBubbleLink>
        </div>
      </article>
      <hr className={styles.separator} />
    </div>
  )
}

export default BlogRoll
