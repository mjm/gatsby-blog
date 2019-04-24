const express = require("express")
const { createServer, proxy } = require("aws-serverless-express")

const app = express()
const server = createServer(app)

exports.handler = async (event, context) =>
  proxy(server, event, context, "PROMISE").promise

app.use((_req, res) => {
  res.status(200).send("Hello world!")
})
