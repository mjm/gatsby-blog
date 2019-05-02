import express from "express"
import multer from "multer"
import httpError from "http-errors"
import { app, router } from "../../micropub/app"
import { requireToken } from "../../micropub/auth"
import { baseUrl } from "../../micropub/config"
import MediaFile from "../../micropub/media"

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
