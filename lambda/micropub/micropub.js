const { createServer, proxy } = require("aws-serverless-express")
const server = createServer(require("./app"))

exports.handler = async (event, context) =>
  proxy(server, event, context, "PROMISE").promise
