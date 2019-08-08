import beeline from "../lib/honeycomb"
import express from "express"
import multer from "multer"
import httpError from "http-errors"
import { app, router } from "../lib/app"
import { requireToken } from "../lib/auth"
import { baseUrl } from "../lib/config"
import * as postMiddleware from "../lib/middleware"

const storage = multer.memoryStorage()
const upload = multer({ storage })

router.get(
  "*",
  requireToken,
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
  "*",
  requireToken,
  express.json(),
  express.urlencoded({ extended: true }),
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

    if (req.post.exists) {
      res.status(204).end()
    } else {
      res.set("Location", baseUrl + req.post.url + "/")
      res.status(202).send("")
    }
  }
)

export default app
