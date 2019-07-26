import React from "react"
import Content, { HTMLContent } from "./Content"
import moment from "moment"
import styles from "./Mentions.module.scss"
import { groupBy, orderBy } from "lodash"
import { useFetch } from "./hooks"

export const MentionCount = ({ url, children }) => {
  function getFetchUrl() {
    const search = new URLSearchParams({ target: url })
    return `https://webmention.io/api/count?${search.toString()}`
  }

  const mentionCount = useFetch(getFetchUrl(), {
    initial: 0,
    transform(data) {
      return data.count
    },
  })

  if (mentionCount === 0) {
    return null
  }

  return children(mentionCount)
}

const Mentions = ({ url }) => {
  function getFetchUrl() {
    if (!url) {
      return null
    }

    const search = new URLSearchParams({ target: url })
    return `https://webmention.io/api/mentions.jf2?${search.toString()}`
  }

  const mentions = useFetch(getFetchUrl(), {
    initial: {},
    transform(data) {
      return groupBy(orderBy(data.children, "published"), "wm-property")
    },
  })

  if (Object.keys(mentions).length === 0) {
    return null
  }

  return (
    <div>
      <hr className={styles.separator} />
      {mentions["like-of"] && (
        <>
          <h3>Likes</h3>
          <div className={styles.likes}>
            {mentions["like-of"].map(mention => (
              <Like key={mention.url} mention={mention} />
            ))}
          </div>
        </>
      )}
      {mentions["in-reply-to"] && (
        <>
          <h3>Replies</h3>
          {mentions["in-reply-to"].map(mention => (
            <Mention key={mention.url} mention={mention} />
          ))}
        </>
      )}
    </div>
  )
}

const Like = ({ mention }) => {
  return (
    <div className={styles.avatar}>
      <MentionAvatar mention={mention} />
    </div>
  )
}

const Mention = ({ mention }) => {
  return (
    <article className={styles.mention}>
      <div className={styles.avatar}>
        <MentionAvatar mention={mention} />
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.author}>
            <MentionAuthor mention={mention} />
          </div>
          <div className={styles.timestamp}>
            <MentionTimestamp mention={mention} />
          </div>
        </div>
        <MentionContent mention={mention} />
      </div>
    </article>
  )
}

const MentionAvatar = ({ mention }) => {
  return (
    <a href={mention.author.url} title={mention.author.name}>
      <img src={mention.author.photo} alt={mention.author.name} />
    </a>
  )
}

const MentionAuthor = ({ mention }) => {
  return <a href={mention.author.url}>{mention.author.name}</a>
}

const MentionTimestamp = ({ mention }) => {
  if (!mention.published) {
    return null
  }

  const formatted = moment.utc(mention.published).format("MMM D, Y h:MM A")

  return (
    <a href={mention.url}>
      <time dateTime={mention.published}>{formatted}</time>
    </a>
  )
}

const MentionContent = ({ mention }) => {
  if (!mention.content) {
    if (mention["wm-property"] === "like-of") {
      return (
        <div className={styles.body}>
          <em>liked this post.</em>
        </div>
      )
    }

    // TODO there are probably other types of mentions
    return null
  }

  if (mention.content.html) {
    return (
      <HTMLContent className={styles.body} content={mention.content.html} />
    )
  }

  if (mention.content.text) {
    return <Content className={styles.body} content={mention.content.text} />
  }

  return null
}

export default Mentions
