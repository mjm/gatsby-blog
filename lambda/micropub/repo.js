const GitHub = require("github-api")
const gh = new GitHub({ token: process.env.GITHUB_TOKEN })
module.exports = gh.getRepo(process.env.GITHUB_USER, process.env.GITHUB_REPO)
