import beeline from "../../micropub/honeycomb"
import express from "express"
import httpError from "http-errors"
import { app, router } from "../../micropub/app"
import { requireToken } from "../../micropub/auth"

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

export default app
