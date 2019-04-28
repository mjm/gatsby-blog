const moment = require("moment")
const mime = require("mime-types")
const uuid = require("uuid/v4")
const crypto = require("crypto")

module.exports = class MediaFile {
  constructor({ buffer, mimetype }) {
    this.buffer = buffer
    this.mimetype = mimetype

    this.url = this._generateUrl()
    this.path = "static" + this.url
    this.oid = this._computeOid()
    this.size = Buffer.byteLength(buffer)
  }

  get pointerFileContent() {
    return `version https://git-lfs.github.com/spec/v1
oid sha256:${this.oid}
size ${this.size}
`
  }

  _generateUrl() {
    const components = ["", "media"]
    components.push(moment.utc().format("YYYY/MM"))

    const ext = this.mimetype ? `.${mime.extension(this.mimetype)}` : ""
    components.push(`${uuid()}${ext}`)

    return components.join("/")
  }

  _computeOid() {
    const hash = crypto.createHash("sha256")
    hash.update(this.buffer)
    return hash.digest("hex")
  }
}
