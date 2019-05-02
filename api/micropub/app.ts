import express from "express"
import promiseRouter from "express-promise-router"
import morgan from "morgan"

export const app = express()

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"))
}

export const router = promiseRouter()
app.use(router)
