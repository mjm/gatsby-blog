/* eslint-disable */
const xmlrpc = require("xmlrpc")
const { URL } = require("url")

const pingURLs = [
  "https://app.courier.blog/ping",
  "https://courier.now.sh/ping",
]

exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body)
    console.log(body)

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }),
    }
  }
}

async function sendPing(client, title, url) {
  return new Promise((resolve, reject) => {
    client.methodCall("weblogUpdates.ping", [title, url], err => {
      err ? reject(err) : resolve()
    })
  })
}
