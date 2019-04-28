const beeline = require("./honeycomb")

const express = require("express")
const morgan = require("morgan")
const multer = require("multer")

const { requireToken } = require("./auth")
const { baseUrl } = require("./config")
const MediaFile = require("./media")
const postMiddleware = require("./middleware")

const app = express()

const storage = multer.memoryStorage()
const upload = multer({ storage })

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"))
}

const router = require("express-promise-router")()

router.use(requireToken)
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.post("/micropub/media", upload.single("file"), async (req, res) => {
  res.status(400).send("Media endpoint is not supported at the moment.")
  return

  const media = new MediaFile(req.file)
  await media.commit()

  res.location(baseUrl + media.url)
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
    generatePost(req)
    console.log(req.post)

    await req.post.commit()

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

module.exports = app
