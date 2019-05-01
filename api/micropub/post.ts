import * as path from "path"
import slug from "slug"
import * as rs from "randomstring"
import moment from "moment"
import matter from "gray-matter"
import "multer"
import httpError from "http-errors"

import MediaFile from "./media"
import { newCommit } from "./commits"

slug.defaults.modes.pretty.lower = true
const SLUG_MAX_LENGTH = 40

export class Post {
  readonly type: "entry"
  readonly title: string
  readonly content: string
  readonly slug: string
  readonly published: Date
  readonly photos: string[]
  readonly media: MediaFile[]
  readonly path: string
  readonly url: string

  static build(attrs: IPostBuilder = {}): PostBuilder {
    const builder = new PostBuilder()
    Object.assign(builder, attrs)
    return builder
  }

  constructor(builder: PostBuilder) {
    if (builder.type !== "entry") {
      throw new httpError.BadRequest("a post's type must be 'entry'")
    }

    this.type = builder.type
    this.title = builder.title || ""
    this.content = builder.content || ""
    this.photos = builder.photos || []
    this.media = builder.media

    this.slug = builder._createSlug()
    if (builder.published) {
      this.published = moment.utc(builder.published).toDate()
    } else {
      this.published = new Date()
    }

    this.url =
      "/" + moment.utc(this.published).format("YYYY-MM-DD-") + this.slug

    const type = this.title ? "blog" : "micro"
    this.path = "src/pages/" + type + this.url + ".md"
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

  private get frontmatter() {
    const data: any = {
      templateKey: this.templateKey,
      date: this.published,
    }

    if (this.title) {
      data.title = this.title
    }

    if (this.photos.length) {
      data.photos = this.photos
    }

    return data
  }

  private get templateKey() {
    return this.title ? "blog-post" : "microblog-post"
  }
}

interface IPostBuilder {
  type?: string | undefined
  title?: string | undefined
  content?: string | undefined
  slug?: string | undefined
  published?: string | Date | undefined
  photos?: string[] | undefined
}

export class PostBuilder implements IPostBuilder {
  type?: string | undefined
  title?: string | undefined
  content?: string | undefined
  slug?: string | undefined
  published?: string | Date | undefined
  photos?: string[] | undefined
  media: MediaFile[]

  constructor() {
    this.media = []
  }

  validate(): string[] {
    const errors = []

    if (!this.type) {
      errors.push("a post must have a type")
    } else if (this.type !== "entry") {
      errors.push('a post\'s type must be "entry"')
    }

    return errors
  }

  addMedia(key: "photos", file?: Express.Multer.File | Express.Multer.File[]) {
    if (!file) {
      return
    }

    // coerce to an array if needed, and wrap all in MediaFile
    const files = (Array.isArray(file) ? file : [file]).map(
      f => new MediaFile(f)
    )

    // add the files to the list of media this post needs to upload
    this.media = this.media.concat(files)

    // url is predetermined, so add the URLs to the appropriate list now
    this[key] = (this[key] || []).concat(files.map(({ url }) => url))
  }

  generate(): Post {
    return new Post(this)
  }

  _createSlug(): string {
    if (this.slug) {
      return this.slug
    }

    if (this.title) {
      return slug(this.title)
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

    return s
  }
}
