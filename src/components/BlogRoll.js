import React from "react"
import { Link } from "gatsby"
import { HTMLContent } from "./Content"
import useSiteMetadata from "./SiteMetadata"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faComment,
  faThumbtack,
  faHeart,
} from "@fortawesome/free-solid-svg-icons"
import { DateBubbleLink } from "./DateBubble"
import styles from "./Blog.module.scss"
import { MentionCount } from "./Mentions"

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

export const BlogRollEntry = ({ siteUrl, post, pinned }) => {
  const entryUrl = siteUrl + post.fields.slug

  return (
    <div>
      <article className={`h-entry ${pinned ? styles.pinned : ""}`}>
        {post.frontmatter.title && (
          <h2 className="p-name">
            <Link className={styles.title} to={post.fields.slug}>
              {post.frontmatter.title}
            </Link>
          </h2>
        )}
        {post.frontmatter.title ? (
          <HTMLContent className="e-content" content={post.excerpt} />
        ) : (
          <HTMLContent className="e-content" content={post.html} />
        )}
        {post.frontmatter.title && (
          <p>
            <Link to={post.fields.slug} className={styles.readMore}>
              Read more…
            </Link>
          </p>
        )}
        <div className={styles.footer}>
          {pinned && (
            <div className={styles.pinnedLabel}>
              <FontAwesomeIcon icon={faThumbtack} />
              <div>Pinned</div>
            </div>
          )}
          <MentionCount url={entryUrl}>
            {({ type }) => (
              <>
                {type.like ? (
                  <div className={styles.mentionCount}>
                    <FontAwesomeIcon icon={faHeart} />
                    {type.like}
                  </div>
                ) : null}
                {type.reply ? (
                  <div className={styles.mentionCount}>
                    <FontAwesomeIcon icon={faComment} />
                    {type.reply}
                  </div>
                ) : null}
              </>
            )}
          </MentionCount>
          <DateBubbleLink
            to={post.fields.slug}
            linkClassName={`u-url ${styles.dateBubble}`}
            className="dt-published"
            isoDate={post.frontmatter.isoDate}
          >
            {post.frontmatter.date}
          </DateBubbleLink>
        </div>
      </article>
      {!pinned && <hr className={styles.separator} />}
    </div>
  )
}

export default BlogRoll
