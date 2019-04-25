const express = require("express")
const morgan = require("morgan")
const bodyParser = require("body-parser")
const multer = require("multer")
const { URL } = require("url")
const slug = require("slug")
const rs = require("randomstring")
const moment = require("moment")
const path = require("path")
const matter = require("gray-matter")
const fetch = require("node-fetch")
const mime = require("mime-types")
const uuid = require("uuid/v4")

const { CommitBuilder } = require("./commits")
const { repo, lfs } = require("./repo")
const baseUrl = "https://www.mattmoriarity.com"

const app = express()

const storage = multer.memoryStorage()
const upload = multer({ storage })

app.use(morgan("combined"))
app.use(validateAuth)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.post(
  "/.netlify/functions/micropub/media",
  upload.single("file"),
  async (req, res, next) => {
    res.status(404).send("Media endpoint is not supported at the moment.")

    try {
      const commit = new CommitBuilder(repo)
      const urlPath = mediaUrl(req.file)
      const destFile = "static" + urlPath

      const { oid, size } = await lfs.persistBuffer({
        buffer: req.file.buffer,
        path: destFile,
        commit,
      })
      await commit.commit(`Uploaded ${urlPath}`)

      res.location(baseUrl + urlPath)
      res.status(201).send({ oid, size })
    } catch (err) {
      next(err)
    }
  }
)
app.get("/.netlify/functions/micropub", async (req, res) => {
  if (req.query.q === "config") {
    res.send({
      "media-endpoint": baseUrl + "/.netlify/functions/micropub/media",
    })
  } else {
    res.status(400).send("Unknown q value")
  }
})
app.post(
  "/.netlify/functions/micropub",
  upload.fields([
    { name: "photo", maxCount: 8 },
    { name: "photo[]", maxCount: 8 },
  ]),
  async (req, res, next) => {
    try {
      const commit = new CommitBuilder(repo)
      const post = readPost(req)
      console.log(post)

      await persistFiles(post, commit)
      const postFile = renderPost(post)

      commit.addFile(post.path, postFile)
      await commit.commit(`Added ${path.basename(post.path)}`)

      res.set("Location", baseUrl + post.urlPath + "/")
      res.status(202).send("")
    } catch (err) {
      next(err)
    }
  }
)

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
  if (
    req.is("application/x-www-form-urlencoded") ||
    req.is("multipart/form-data")
  ) {
    post = readPostForm(req.body, req.files)
  } else if (req.is("application/json")) {
    post = readPostJson(req.body)
  } else {
    throw new Error(`Unexpected content type: ${req.get("content-type")}`)
  }

  post.content = post.content || ""
  post.templateKey = post.title ? "blog-post" : "microblog-post"
  post.slug = createSlug(post)
  post.published = post.published || new Date()
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

  if (post.photos) {
    frontmatter.photos = post.photos
  }

  return matter.stringify("\n" + post.content, frontmatter)
}

async function persistFiles(post, commit) {
  if (post.photoFiles) {
    const photoPaths = []

    for (const file of post.photoFiles) {
      const urlPath = mediaUrl(file)
      const destFile = "static" + urlPath

      await lfs.persistBuffer({
        buffer: file.buffer,
        path: destFile,
        commit,
      })

      photoPaths.push(urlPath)
    }

    post.photos = photoPaths
  }
}

function readPostForm(body, files) {
  if (body.h !== "entry") {
    throw new Error("Cannot create a post that is not an entry.")
  }

  const post = {}
  post.type = body.h
  if (body.content) {
    post.content = body.content
  }
  if (body.name) {
    post.title = body.name
  }
  if (body.published) {
    post.published = body.published
  }
  if (body["mp-slug"]) {
    post.slug = body.slug
  }
  if (body.photo) {
    post.photos = Array.isArray(body.photo) ? body.photo : [body.photo]
  }
  if (files) {
    if (files.photo) {
      post.photoFiles = files.photo
    }
    if (files["photo[]"]) {
      post.photoFiles = files["photo[]"]
    }
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
  if (props.published) {
    post.published = props.published[0]
  }
  if (props["mp-slug"]) {
    post.slug = props["mp-slug"][0]
  }
  if (props.photo) {
    post.photos = props.photo
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

function mediaUrl(file) {
  const components = ["", "media"]
  components.push(moment.utc().format("YYYY/MM"))

  const ext = file.mimetype ? `.${mime.extension(file.mimetype)}` : ""
  components.push(`${uuid()}${ext}`)

  return components.join("/")
}

module.exports = app
