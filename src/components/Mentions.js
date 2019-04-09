import React, { useEffect, useState } from "react"
import { HTMLContent } from "./Content"
import moment from "moment"

const Mentions = ({ url }) => {
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
      <hr className="h-1 bg-purple-100 mx-auto w-1/3 rounded-full mt-6" />
      <h3>Mentions</h3>
      {mentions.map(mention => (
        <Mention key={mention.url} mention={mention} />
      ))}
    </div>
  )
}

const Mention = ({ mention }) => {
  return (
    <article className="flex flex-row mt-3 bg-purple-100 px-3 py-2 rounded-lg shadow">
      <div className="mr-3 flex-none">
        <MentionAvatar mention={mention} />
      </div>
      <div className="flex flex-col flex-grow text-xs">
        <div className="flex flex-row">
          <div className="flex-grow mb-1">
            <MentionAuthor mention={mention} />
          </div>
          <div className="flex-no-grow">
            <MentionTimestamp mention={mention} />
          </div>
        </div>
        <HTMLContent
          className="mention-content"
          content={mention.content.html}
        />
      </div>
    </article>
  )
}

const MentionAvatar = ({ mention }) => {
  return (
    <a href={mention.author.url}>
      <img
        src={mention.author.photo}
        alt={mention.author.name}
        className="w-10 mb-0 rounded-full"
      />
    </a>
  )
}

const MentionAuthor = ({ mention }) => {
  return (
    <a
      href={mention.author.url}
      className="font-bold no-underline text-purple-800"
    >
      {mention.author.name}
    </a>
  )
}

const MentionTimestamp = ({ mention }) => {
  if (!mention.published) {
    return null
  }

  const formatted = moment(mention.published).format("MMM D, Y H:MM A")

  return (
    <a href={mention.url} className="text-purple-700 no-underline">
      <time dateTime={mention.published}>{formatted}</time>
    </a>
  )
}

export default Mentions
