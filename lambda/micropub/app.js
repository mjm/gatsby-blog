const beeline = require("honeycomb-beeline")({
  writeKey: process.env.HONEYCOMB_WRITE_KEY,
  dataset: "gatsby-blog",
  serviceName: "micropub",
})

const express = require("express")
const morgan = require("morgan")
const multer = require("multer")
const moment = require("moment")
const path = require("path")
const mime = require("mime-types")
const uuid = require("uuid/v4")

const { requireToken } = require("./auth")
const { CommitBuilder } = require("./commits")
const { baseUrl } = require("./config")
const postMiddleware = require("./middleware")
const { repo, lfs } = require("./repo")

const app = express()

const storage = multer.memoryStorage()
const upload = multer({ storage })

app.use(morgan("combined"))

const router = require("express-promise-router")()

router.use(requireToken)
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

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
  postMiddleware.form,
  postMiddleware.json,
  async (req, res) => {
    const commit = new CommitBuilder(repo)

    generatePost(req)
    console.log(req.post)

    await persistFiles(req.post, commit)

    commit.addFile(req.post.path, req.post.render())
    await commit.commit(`Added ${path.basename(req.post.path)}`)

    res.set("Location", baseUrl + req.post.url + "/")
    res.status(202).send("")
  }
)

app.use("/.netlify/functions", router)

function generatePost(req) {
  if (!req.post) {
    throw new Error(`Unexpected content type: ${req.get("content-type")}`)
  }

  const errors = req.post.validate()
  if (errors.length > 0) {
    throw new Error(`Could not create post: ${errors.join(", ")}`)
  }

  req.post.generate()
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

function mediaUrl(file) {
  const components = ["", "media"]
  components.push(moment.utc().format("YYYY/MM"))

  const ext = file.mimetype ? `.${mime.extension(file.mimetype)}` : ""
  components.push(`${uuid()}${ext}`)

  return components.join("/")
}

module.exports = app
