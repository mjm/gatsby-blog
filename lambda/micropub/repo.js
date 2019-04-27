const GitHub = require("github-api")
const LFS = require("./lfs")
const { CommitBuilder } = require("./commits")

const gh = new GitHub({ token: process.env.GITHUB_TOKEN })
const lfsUrl = `https://access-token:${
  process.env.NETLIFY_TOKEN
}@www.mattmoriarity.com/.netlify/large-media`

const repo = gh.getRepo(process.env.GITHUB_USER, process.env.GITHUB_REPO)

exports.repo = repo
exports.lfs = new LFS(repo, lfsUrl)

exports.newCommit = function newCommit(branch = "master") {
  return new CommitBuilder(repo, branch)
}
