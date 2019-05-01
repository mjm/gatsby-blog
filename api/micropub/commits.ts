import * as git from "./git"
import MediaFile from "./media"

class CommitBuilder {
  branch: string
  files: git.CommitFile[]
  mediaFiles: MediaFile[]

  constructor(branch: string) {
    this.branch = branch
    this.files = []
    this.mediaFiles = []
  }

  addFile(path: string, content: string) {
    console.log(`Adding file ${path} to commit`)
    this.files.push({
      path,
      content,
      mode: "100644",
      type: "blob",
    })
  }

  addMediaFile(file: MediaFile) {
    console.log(`Adding media file ${file.path} to commit`)
    this.mediaFiles.push(file)

    this.files.push({
      path: file.path,
      content: file.pointerFileContent,
      mode: "100644",
      type: "blob",
    })
  }

  async commit(message: string): Promise<void> {
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

function getDefaultBranch() {
  if (process.env.GITHUB_BRANCH) {
    return process.env.GITHUB_BRANCH
  }

  if (
    process.env.NOW_GITHUB_COMMIT_REF &&
    process.env.NOW_GITHUB_COMMIT_REF !== "master"
  ) {
    return "testing"
  }

  return "master"
}

export function newCommit(branch = getDefaultBranch()): CommitBuilder {
  return new CommitBuilder(branch)
}
