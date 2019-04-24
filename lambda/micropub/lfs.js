const fetch = require("node-fetch")
const crypto = require("crypto")

class LFS {
  constructor(repo, baseUrl) {
    this.repo = repo
    this.baseUrl = baseUrl
    this.batchUrl = baseUrl + "/objects/batch"
  }

  async persistBuffer({ buffer, path }) {
    const hash = crypto.createHash("sha256")
    hash.update(buffer)
    const oid = hash.digest("hex")
    const size = Buffer.byteLength(buffer)

    console.log(oid, size)

    await this._writeRefFile(oid, size, path)
    await this._uploadBlob(buffer, oid, size)
    return { oid, size }
  }

  async _writeRefFile(shaString, size, path) {
    const refFile = `version https://git-lfs.github.com/spec/v1
oid sha256:${shaString}
size ${size}`

    await this.repo.writeFile("master", path, refFile, `Upload "${path}"`, {
      encode: true,
    })
  }

  async _uploadBlob(buffer, shaString, size) {
    const payload = {
      operation: "upload",
      transfers: ["basic"],
      objects: [
        {
          oid: shaString,
          size: size,
        },
      ],
    }

    let response = await fetch(this.batchUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        Accept: "applications/vnd.git-lfs+json",
        "Content-Type": "applications/vnd.git-lfs+json",
      },
    })
    const responseJson = await response.json()

    const { href, header } = responseJson.objects[0].actions.upload
    if (!href) {
      throw new Error("No upload URL found in Git-LFS response")
    }

    const headers = header || {}

    await fetch(href, {
      method: "PUT",
      body: buffer,
      headers: { "Content-Type": "application/octet-stream", ...headers },
    })
  }
}

module.exports = LFS
