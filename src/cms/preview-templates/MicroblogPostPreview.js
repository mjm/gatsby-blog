import React from "react"
import PropTypes from "prop-types"
import { MicroblogPostTemplate } from "../../templates/microblog-post"

const MicroblogPostPreview = ({ widgetFor }) => (
  <MicroblogPostTemplate content={widgetFor("body")} />
)

MicroblogPostPreview.propTypes = {
  widgetFor: PropTypes.func,
}

export default MicroblogPostPreview
