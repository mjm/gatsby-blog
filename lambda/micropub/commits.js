const beeline = require("honeycomb-beeline")

class CommitBuilder {
  constructor(repo, branch = "master") {
    this.repo = repo
    this.branch = branch
    this.files = []
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

  async commit(message) {
    if (this.files.length === 0) {
      return
    }

    if (!message) {
      message = `Changed ${this.files.length} files.`
    }

    await beeline.startAsyncSpan(
      {
        "app.commit.message": message,
        "app.commit.branch": this.branch,
        "app.commit.files": this.files.length,
      },
      async span => {
        const branch = await this._getBranch()
        const parentCommit = branch.commit.sha
        beeline.customContext.add("commit.old_sha", parentCommit)

        const parentTree = branch.commit.commit.tree.sha
        beeline.customContext.add("commit.old_tree_sha", parentTree)

        const { sha: treeSha } = await this._createTree(parentTree)
        beeline.customContext.add("commit.new_tree_sha", treeSha)

        await this._createCommit(parentCommit, treeSha, message)

        beeline.finishSpan(span)
      }
    )
  }

  async _getBranch() {
    const response = await this.repo.getBranch(this.branch)
    return response.data
  }

  async _createTree(parent) {
    console.log(`Creating tree with ${this.files.length} files`)
    const response = await this.repo.createTree(this.files, parent)
    return response.data
  }

  async _createCommit(parent, tree, message) {
    console.log(`Creating commit "${message}"`)
    const response = await this.repo.commit(parent, tree, message)
    const { sha } = response.data

    beeline.customContext.add("commit.new_sha", sha)

    await this.repo.updateHead(`heads/${this.branch}`, sha, false)
  }
}

exports.CommitBuilder = CommitBuilder
