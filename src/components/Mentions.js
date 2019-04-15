import React, { useEffect, useState } from "react"
import { HTMLContent } from "./Content"
import moment from "moment"
import styles from "./Mentions.module.scss"

// use for testing mentions on posts that don't have any
// eslint-disable-next-line
const exampleMentions = [
  {
    type: "entry",
    author: {
      type: "card",
      name: "Tantek Çelik",
      url: "http://tantek.com/",
      photo: "http://tantek.com/logo.jpg",
    },
    url:
      "http://tantek.com/2013/112/t2/milestone-show-indieweb-comments-h-entry-pingback",
    published: "2013-04-22T15:03:00-07:00",
    "wm-received": "2013-04-25T17:09:33-07:00",
    "wm-id": 900,
    content: {
      text:
        "Another milestone: @eschnou automatically shows #indieweb comments with h-entry sent via pingback http://eschnou.com/entry/testing-indieweb-federation-with-waterpigscouk-aaronpareckicom-and--62-24908.html",
      html:
        'Another milestone: <a href="https://twitter.com/eschnou">@eschnou</a> automatically shows #indieweb comments with h-entry sent via pingback <a href="http://eschnou.com/entry/testing-indieweb-federation-with-waterpigscouk-aaronpareckicom-and--62-24908.html">http://eschnou.com/entry/testing-indieweb-federation-with-waterpigscouk-aaronpareckicom-and--62-24908.html</a>',
    },
    "mention-of": "https://indieweb.org/",
    "wm-property": "mention-of",
    "wm-private": false,
  },
]

const Mentions = ({ url }) => {
  //const [mentions, setMentions] = useState(exampleMentions)
  const [mentions, setMentions] = useState([])
  useEffect(() => {
    loadMentions()
  }, [url])

  async function loadMentions() {
    if (!url) {
      return
    }

    const search = new URLSearchParams({ target: url })
    const fetchUrl = `https://webmention.io/api/mentions.jf2?${search.toString()}`

    const response = await fetch(fetchUrl)
    const responseJson = await response.json()

    setMentions(responseJson.children)
  }

  if (mentions.length === 0) {
    return null
  }

  return (
    <div>
      <hr className={styles.separator} />
      <h3>Mentions</h3>
      {mentions.map(mention => (
        <Mention key={mention.url} mention={mention} />
      ))}
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
        <HTMLContent className={styles.body} content={mention.content.html} />
      </div>
    </article>
  )
}

const MentionAvatar = ({ mention }) => {
  return (
    <a href={mention.author.url}>
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

  const formatted = moment(mention.published).format("MMM D, Y H:MM A")

  return (
    <a href={mention.url}>
      <time dateTime={mention.published}>{formatted}</time>
    </a>
  )
}

export default Mentions
