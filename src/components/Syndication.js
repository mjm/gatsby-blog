import React from "react"

export const Syndication = ({ urls }) => {
  if (!urls) {
    return null
  }

  return urls.map((url, index) => (
    <link key={index} rel="syndication" className="u-syndication" href={url} />
  ))
}
