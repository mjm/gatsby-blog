const GitHub = require("github-api")
const LFS = require("./lfs")

const gh = new GitHub({ token: process.env.GITHUB_TOKEN })
const lfsUrl = `https://access-token:${
  process.env.NETLIFY_TOKEN
}@www.mattmoriarity.com/.netlify/large-media`

exports.repo = gh.getRepo(process.env.GITHUB_USER, process.env.GITHUB_REPO)
exports.lfs = new LFS(exports.repo, lfsUrl)
