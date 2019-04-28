const path = require("path")
const slug = require("slug")
const rs = require("randomstring")
const moment = require("moment")
const matter = require("gray-matter")

const MediaFile = require("./media")
const { newCommit } = require("./commits")

slug.defaults.modes.pretty.lower = true
const SLUG_MAX_LENGTH = 40

module.exports = class Post {
  constructor() {
    this.media = []
  }

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

  addMedia(key, file) {
    if (!file) {
      return
    }

    // coerce to an array if needed, and wrap all in MediaFile
    const files = [].concat(file).map(f => new MediaFile(f))

    // add the files to the list of media this post needs to upload
    this.media = this.media.concat(files)

    // url is predetermined, so add the URLs to the appropriate list now
    this[key] = (this[key] || []).concat(files.map(({ url }) => url))
  }

  generate() {
    this._createSlug()
    this._publish()
    this._generatePath()
  }

  render() {
    return matter.stringify("\n" + this.content, this.frontmatter)
  }

  async commit() {
    const commit = newCommit()

    commit.addFile(this.path, this.render())
    for (const file of this.media) {
      commit.addMediaFile(file)
    }

    await commit.commit(`Added ${path.basename(this.path)}`)
  }

  get frontmatter() {
    const data = {
      templateKey: this.templateKey,
      date: this.published,
    }

    if (this.title) {
      data.title = this.title
    }

    if (this.photos) {
      data.photos = this.photos
    }

    return data
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
