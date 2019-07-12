/* eslint-disable */
const xmlrpc = require("xmlrpc")

const pingURLs = [
  "https://courier.blog/ping",
  "https://staging.courier.blog/ping",
  "https://app.courier.blog/ping",
  "https://courier-staging.herokuapp.com/ping",
]

exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body)

    const title = body.site.name
    const url = body.site.url

    for (const pingURL of pingURLs) {
      const client = pingURL.startsWith("https")
        ? xmlrpc.createSecureClient(pingURL)
        : xmlrpc.createClient(pingURL)

      await sendPing(client, title, url)
    }

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
