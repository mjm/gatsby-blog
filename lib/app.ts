import express from "express"
import promiseRouter from "express-promise-router"
import morgan from "morgan"

export const app = express()

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"))
}

export const router = promiseRouter()
app.use(router)

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!err) {
      next()
    }

    if (res.headersSent) {
      next(err)
    }

    const env = process.env.NODE_ENV || "development"
    const prodMessage = err.message || err.toString()
    const devMessage = err.stack || prodMessage
    const status = err.statusCode || 500

    if (env !== "test") {
      console.error(devMessage)
    }

    res
      .type("text")
      .status(status)
      .send(env === "development" ? devMessage : prodMessage)
  }
)
