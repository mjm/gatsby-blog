const beeline = require("honeycomb-beeline")({
  writeKey: process.env.HONEYCOMB_WRITE_KEY,
  dataset: "gatsby-blog",
  serviceName: "micropub",
})

const express = require("express")
const morgan = require("morgan")
const bodyParser = require("body-parser")
const multer = require("multer")
const { URL } = require("url")
const moment = require("moment")
const path = require("path")
const matter = require("gray-matter")
const fetch = require("node-fetch")
const mime = require("mime-types")
const uuid = require("uuid/v4")

const { CommitBuilder } = require("./commits")
const { repo, lfs } = require("./repo")
const Post = require("./post")
const baseUrl = "https://www.mattmoriarity.com"

const app = express()

const storage = multer.memoryStorage()
const upload = multer({ storage })

app.use(morgan("combined"))
app.use(validateAuth)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const router = require("express-promise-router")()
router.post("/micropub/media", upload.single("file"), async (req, res) => {
  res.status(400).send("Media endpoint is not supported at the moment.")
  return

  const commit = new CommitBuilder(repo)
  const urlPath = mediaUrl(req.file)
  const destFile = "static" + urlPath

  await lfs.persistBuffer(
    {
      buffer: req.file.buffer,
      path: destFile,
    },
    commit
  )
  await commit.commit(`Uploaded ${urlPath}`)

  res.location(baseUrl + urlPath)
  res.status(201).send({})
})
router.get("/micropub", async (req, res) => {
  beeline.customContext.add("micropub.q", req.query.q)

  if (req.query.q === "config") {
    res.send({
      "media-endpoint": baseUrl + "/.netlify/functions/micropub/media",
    })
  } else {
    res.status(400).send("Unknown q value")
  }
})
router.post(
  "/micropub",
  upload.fields([
    { name: "photo", maxCount: 8 },
    { name: "photo[]", maxCount: 8 },
  ]),
  async (req, res) => {
    const commit = new CommitBuilder(repo)

    const post = readPost(req)
    console.log(post)

    await persistFiles(post, commit)

    const postFile = renderPost(post)
    commit.addFile(post.path, postFile)

    await commit.commit(`Added ${path.basename(post.path)}`)

    res.set("Location", baseUrl + post.url + "/")
    res.status(202).send("")
  }
)

app.use("/.netlify/functions", router)

const TOKEN_URL = "https://tokens.indieauth.com/token"

async function validateAuth(req, res, next) {
  let token
  try {
    token = getAuthToken(req)
    if (!token) {
      beeline.customContext.add("token_present", false)

      res.status(401).send("No auth token provided")
      return
    }
  } catch (e) {
    res.status(400).send(e.message)
    return
  }

  beeline.customContext.add("token_present", true)

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
  beeline.customContext.add("me", actualMe)

  if (expectedMe !== actualMe) {
    res.status(403).send("Forbidden")
    return
  }

  beeline.customContext.add("scope", responseJson.scope)
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
  const post = new Post()
  if (
    req.is("application/x-www-form-urlencoded") ||
    req.is("multipart/form-data")
  ) {
    readPostForm(post, req.body, req.files)
  } else if (req.is("application/json")) {
    readPostJson(post, req.body)
  } else {
    throw new Error(`Unexpected content type: ${req.get("content-type")}`)
  }

  const errors = post.validate()
  if (errors.length > 0) {
    throw new Error(`Could not create post: ${errors.join(", ")}`)
  }

  post.generate()
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
    const files = post.photoFiles.map(file => {
      const url = mediaUrl(file)
      const path = "static" + url
      return { ...file, url, path }
    })

    const uploadedFiles = await lfs.persistBuffers(files, commit)

    post.photos = uploadedFiles.map(({ url }) => url)
  }
}

function readPostForm(post, body, files) {
  beeline.customContext.add("micropub.request_type", "form")

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
}

function readPostJson(post, { type, properties: props }) {
  beeline.customContext.add("micropub.request_type", "json")

  post.type = type[0].replace(/^h-/, "")
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
}

function mediaUrl(file) {
  const components = ["", "media"]
  components.push(moment.utc().format("YYYY/MM"))

  const ext = file.mimetype ? `.${mime.extension(file.mimetype)}` : ""
  components.push(`${uuid()}${ext}`)

  return components.join("/")
}

module.exports = app
