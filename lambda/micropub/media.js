const moment = require("moment")
const mime = require("mime-types")
const uuid = require("uuid/v4")

module.exports = class MediaFile {
  constructor({ buffer, mimetype }) {
    this.buffer = buffer
    this.mimetype = mimetype

    this.url = this._generateUrl()
    this.path = "static" + this.url
  }

  _generateUrl() {
    const components = ["", "media"]
    components.push(moment.utc().format("YYYY/MM"))

    const ext = this.mimetype ? `.${mime.extension(this.mimetype)}` : ""
    components.push(`${uuid()}${ext}`)

    return components.join("/")
  }
}
