import beeline from "./honeycomb"

import express from "express"
import promiseRouter from "express-promise-router"
import httpError from "http-errors"
import morgan from "morgan"
import multer from "multer"

import { requireToken } from "./auth"
import { baseUrl } from "./config"
import MediaFile from "./media"
import * as postMiddleware from "./middleware"

const app = express()

const storage = multer.memoryStorage()
const upload = multer({ storage })

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"))
}

const router = promiseRouter()

router.use(requireToken)
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.post(
  "/api/micropub/media",
  upload.single("file"),
  async (req: express.Request, res: express.Response) => {
    throw new httpError.BadRequest(
      "media endpoint is not supported at the moment"
    )

    const media = new MediaFile(req.file)
    await media.commit()

    res.location(baseUrl + media.url)
    res.status(201).send({})
  }
)
router.get(
  "/api/micropub",
  async (req: express.Request, res: express.Response) => {
    beeline.customContext.add("micropub.q", req.query.q)

    if (req.query.q === "config") {
      res.send({
        "media-endpoint": "https://gatsby-blog.mjm.now.sh/api/micropub/media",
      })
    } else {
      throw new httpError.BadRequest("unknown 'q' value")
    }
  }
)
router.post(
  "/api/micropub",
  upload.fields([
    { name: "photo", maxCount: 8 },
    { name: "photo[]", maxCount: 8 },
  ]),
  postMiddleware.form,
  postMiddleware.json,
  async (req: express.Request, res: express.Response) => {
    if (!req.post) {
      throw new httpError.BadRequest(
        `unexpected content type: '${req.get("content-type")}'`
      )
    }

    console.log(req.post)
    await req.post.commit()

    res.set("Location", baseUrl + req.post.url + "/")
    res.status(202).send("")
  }
)

app.use(router)

export default app
