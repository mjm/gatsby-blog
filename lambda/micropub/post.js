const slug = require("slug")
const rs = require("randomstring")
const moment = require("moment")

slug.defaults.modes.pretty.lower = true
const SLUG_MAX_LENGTH = 40

module.exports = class Post {
  get content() {
    return this._content || ""
  }

  set content(value) {
    this._content = value
  }

  get templateKey() {
    return this.isMicro ? "microblog-post" : "blog-post"
  }

  get isMicro() {
    return !this.title
  }

  validate() {
    const errors = []

    if (!this.type) {
      errors.push("a post must have a type")
    } else if (this.type !== "entry") {
      errors.push('a post\'s type must be "entry"')
    }

    return errors
  }

  generate() {
    this._createSlug()
    this._publish()
    this._generatePath()
  }

  _createSlug() {
    if (this.slug) {
      return
    }

    if (this.title) {
      this.slug = slug(this.title)
      return
    }

    // sometimes a post has no content or title (usually OwnYourGram posts).
    // in that case, use a 10-character random string in the slug
    const content = this.content || rs.generate(10)

    let s = slug(content)
    if (s.length > SLUG_MAX_LENGTH) {
      s = s.substring(0, SLUG_MAX_LENGTH)

      const i = s.lastIndexOf("-")
      s = s.substring(0, i)
    }

    this.slug = s
  }

  _publish() {
    if (this.published) {
      this.published = moment.utc(this.published).toDate()
    } else {
      this.published = new Date()
    }

    this.url =
      "/" + moment.utc(this.published).format("YYYY-MM-DD-") + this.slug
  }

  _generatePath() {
    const type = this.isMicro ? "micro" : "blog"
    this.path = "src/pages/" + type + this.url + ".md"
  }
}
