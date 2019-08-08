import express from "express"
import multer from "multer"
import httpError from "http-errors"
import { app, router } from "../../lib/app"
import { requireToken } from "../../lib/auth"
import { baseUrl } from "../../lib/config"
import MediaFile from "../../lib/media"

const storage = multer.memoryStorage()
const upload = multer({ storage })

router.post(
  "/api/micropub/media",
  requireToken,
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

export default app
