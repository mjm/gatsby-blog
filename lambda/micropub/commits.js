const git = require("./git")

class CommitBuilder {
  constructor(branch) {
    this.branch = branch
    this.files = []
    this.mediaFiles = []
  }

  addFile(path, content) {
    console.log(`Adding file ${path} to commit`)
    this.files.push({
      path,
      content,
      mode: "100644",
      type: "blob",
    })
  }

  addMediaFile(file) {
    console.log(`Adding media file ${file.path} to commit`)
    this.mediaFiles.push(file)

    this.files.push({
      path: file.path,
      content: file.pointerFileContent,
      mode: "100644",
      type: "blob",
    })
  }

  async commit(message) {
    if (this.files.length === 0) {
      return
    }

    if (!message) {
      message = `Changed ${this.files.length} files.`
    }

    await git.upload(this.mediaFiles)
    await git.commit({
      branch: this.branch,
      message: message,
      files: this.files,
    })
  }
}

exports.newCommit = function(branch = "master") {
  return new CommitBuilder(branch)
}
