const { CommitBuilder } = jest.requireActual("../commits")

exports.CommitBuilder = jest.fn(() => {
  const commit = new CommitBuilder(null, "master")
  commit.commit = jest.fn(() => {
    console.log("calling my mock?")
    return Promise.resolve()
  })
  return commit
})

exports.CommitBuilder = class extends CommitBuilder {
  constructor() {
    super(null, "master")
    this.commit = jest.fn().mockResolvedValue()
    exports.CommitBuilder.instances.push(this)
  }
}
exports.CommitBuilder.instances = []
