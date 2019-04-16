const React = require("react")
const { withPrefix } = require("gatsby")

exports.onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    React.createElement("link", {
      key: "json-feed",
      rel: "alternate",
      type: "application/json",
      href: withPrefix("/feed.json"),
    }),
  ])
}
