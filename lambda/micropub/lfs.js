const beeline = require("honeycomb-beeline")
const fetch = require("node-fetch")
const crypto = require("crypto")

class LFS {
  constructor(repo, baseUrl) {
    this.repo = repo
    this.batchUrl = baseUrl + "/objects/batch"
  }

  async persistBuffers(files, commit) {
    beeline.customContext.add("lfs.file_count", files.length)

    // Compute OID and size for all files
    files = files.map(file => {
      const { oid, size } = this._computeId(file)
      return { ...file, oid, size }
    })

    await this._initiateTransfer(files)
    for (const file of files) {
      await this._uploadFile(file)
      this._writePointerFile(file, commit)
    }

    return files
  }

  async persistBuffer(file, commit) {
    const results = await this.persistBuffers([file], commit)
    return results[0]
  }

  _computeId({ buffer }) {
    const hash = crypto.createHash("sha256")
    hash.update(buffer)
    const oid = hash.digest("hex")
    const size = Buffer.byteLength(buffer)

    return { oid, size }
  }

  async _initiateTransfer(files) {
    const payload = {
      operation: "upload",
      transfers: ["basic"],
      objects: files.map(({ oid, size }) => ({ oid, size })),
    }

    const response = await fetch(this.batchUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        Accept: "applications/vnd.git-lfs+json",
        "Content-Type": "applications/vnd.git-lfs+json",
      },
    })
    const responseJson = await response.json()

    let existingFiles = 0
    responseJson.objects.forEach((object, i) => {
      if (!object.actions || !object.actions.upload) {
        // If there is no upload action, then we've probably already the file with this SHA before.
        existingFiles++
        return
      }

      const { href, header } = object.actions.upload
      files[i].href = href
      files[i].headers = header || {}
    })

    beeline.customContext.add("lfs.existing_files", existingFiles)
  }

  async _uploadFile({ href, buffer, headers }) {
    await fetch(href, {
      method: "PUT",
      body: buffer,
      headers: { "Content-Type": "application/octet-stream", ...headers },
    })
  }

  _writePointerFile({ oid, size, path }, commit) {
    const pointerFile = `version https://git-lfs.github.com/spec/v1
oid sha256:${oid}
size ${size}
`

    commit.addFile(path, pointerFile)
  }
}

module.exports = LFS
