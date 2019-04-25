class CommitBuilder {
  constructor(repo, branch = "master") {
    this.repo = repo
    this.branch = branch
    this.files = []
  }

  addFile(path, content) {
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

    const branch = await this._getBranch()
    const parentCommit = branch.commit.sha
    const parentTree = branch.commit.commit.tree.sha

    const { sha: treeSha } = await this._createTree(parentTree)
    await this._createCommit(parentCommit, treeSha, message)
  }

  async _getBranch() {
    const response = await this.repo.getBranch(this.branch)
    return response.data
  }

  async _createTree(parent) {
    const response = await this.repo.createTree(this.files, parent)
    return response.data
  }

  async _createCommit(parent, tree, message) {
    const response = await this.repo.commit(parent, tree, message)
    return response.data
  }
}

exports.CommitBuilder = CommitBuilder
