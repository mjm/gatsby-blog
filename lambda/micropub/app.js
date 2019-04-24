const express = require("express")
const bodyParser = require("body-parser")
const { URL } = require("url")
const slug = require("slug")
const rs = require("randomstring")
const moment = require("moment")
const path = require("path")
const matter = require("gray-matter")
const fetch = require("node-fetch")
const repo = require("./repo")

const baseUrl = "https://www.mattmoriarity.com"

const app = express()

app.use(validateAuth)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.post("/.netlify/functions/micropub/media", async (req, res) => {
  res.status(200).send("This is the media endpoint")
})
app.post("/.netlify/functions/micropub", async (req, res) => {
  const post = readPost(req)
  console.log(post)
  const postFile = renderPost(post)

  await repo.writeFile(
    "master",
    post.path,
    postFile,
    `Added ${path.basename(post.path)}`,
    { encode: true }
  )

  res.set("Location", baseUrl + post.urlPath + "/")
  res.status(202).send("")
})

const TOKEN_URL = "https://tokens.indieauth.com/token"

async function validateAuth(req, res, next) {
  let token
  try {
    token = getAuthToken(req)
    if (!token) {
      res.status(401).send("No auth token provided")
      return
    }
  } catch (e) {
    res.status(400).send(e.message)
    return
  }

  const response = await fetch(TOKEN_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })
  if (!response.ok) {
    res.status(500).send("Bad response from token endpoint")
    return
  }

  const responseJson = await response.json()

  const expectedMe = new URL(baseUrl).hostname
  const actualMe = new URL(responseJson.me).hostname
  if (expectedMe !== actualMe) {
    res.status(403).send("Forbidden")
    return
  }

  if (responseJson.scope.indexOf("create") >= 0) {
    next()
  } else {
    res.status(403).send("Need create scope")
  }
}

function getAuthToken(req) {
  const authz = req.get("authorization")
  if (!authz) {
    return null
  }

  const [type, token] = authz.split(" ")
  if (type !== "Bearer") {
    throw new Error(`Invalid authorization type '${type}`)
  }

  return token
}

function readPost(req) {
  let post
  if (req.is("application/x-www-form-urlencoded")) {
    post = readPostUrlEncoded(req.body)
  } else if (req.is("application/json")) {
    post = readPostJson(req.body)
  } else {
    return null
  }

  post.templateKey = post.title ? "blog-post" : "microblog-post"
  post.slug = createSlug(post)
  post.published = new Date()
  post.urlPath =
    "/" + moment.utc(post.published).format("YYYY-MM-DD-") + post.slug
  post.path = createPath(post)

  return post
}

function renderPost(post) {
  const frontmatter = {
    templateKey: post.templateKey,
    date: post.published,
  }

  if (post.title) {
    frontmatter.title = post.title
  }

  return matter.stringify("\n" + post.content, frontmatter)
}

function readPostUrlEncoded(body) {
  const post = {}
  post.type = body.h
  if (body.content) {
    post.content = body.content
  }
  if (body.name) {
    post.title = body.name
  }
  if (body["mp-slug"]) {
    post.slug = body.slug
  }

  if (post.type !== "entry") {
    throw new Error("Cannot create a post that is not an entry.")
  }

  return post
}

function readPostJson({ type, properties: props }) {
  if (type[0] !== "h-entry") {
    throw new Error("Cannot create a post that is not an entry.")
  }

  const post = { type: "entry" }
  if (props.name) {
    post.title = props.name[0]
  }
  if (props.content) {
    post.content = props.content[0]
  }
  if (props["mp-slug"]) {
    post.slug = props["mp-slug"][0]
  }

  return post
}

slug.defaults.modes.pretty.lower = true
const SLUG_MAX_LENGTH = 40

function createSlug(post) {
  if (post.slug) {
    return post.slug
  }

  if (post.title) {
    return slug(post.title)
  }

  let content
  if (post.content) {
    content = post.content
  } else {
    content = rs.generate(10)
  }

  let s = slug(content)
  if (s.length > SLUG_MAX_LENGTH) {
    s = s.substring(0, SLUG_MAX_LENGTH)

    const i = s.lastIndexOf("-")
    s = s.substring(0, i)
  }

  return s
}

function createPath(post) {
  let path = "src/pages/"
  if (post.templateKey === "blog-post") {
    path += "blog"
  } else {
    path += "micro"
  }

  path += post.urlPath
  path += ".md"

  return path
}

module.exports = app
