import moment from "moment"
import * as mime from "mime-types"
import uuid from "uuid/v4"
import { createHash } from "crypto"

import { newCommit } from "./commits"

export default class MediaFile {
  buffer: Buffer
  mimetype: string
  url: string
  path: string
  oid: string
  size: number

  href?: string
  headers?: any

  constructor({ buffer, mimetype }: { buffer: Buffer; mimetype: string }) {
    this.buffer = buffer
    this.mimetype = mimetype

    this.url = this._generateUrl()
    this.path = "static" + this.url
    this.oid = this._computeOid()

    // Buffer.byteLength actually supports many types besides just strings
    // @ts-ignore
    this.size = Buffer.byteLength(buffer)
  }

  get pointerFileContent(): string {
    return `version https://git-lfs.github.com/spec/v1
oid sha256:${this.oid}
size ${this.size}
`
  }

  async commit(): Promise<void> {
    const commit = newCommit()
    commit.addMediaFile(this)
    await commit.commit(`Uploaded ${this.url}`)
  }

  _generateUrl(): string {
    const components = ["", "media"]
    components.push(moment.utc().format("YYYY/MM"))

    const ext = this.mimetype ? `.${mime.extension(this.mimetype)}` : ""
    components.push(`${uuid()}${ext}`)

    return components.join("/")
  }

  _computeOid(): string {
    const hash = createHash("sha256")
    hash.update(this.buffer)
    return hash.digest("hex")
  }
}
