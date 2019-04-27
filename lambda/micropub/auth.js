const beeline = require("honeycomb-beeline")
const { URL } = require("url")
const fetch = require("node-fetch")

const TOKEN_URL = "https://tokens.indieauth.com/token"

let expectedToken = null

exports.setExpectedToken = token => {
  expectedToken = token
}

exports.requireToken = async function requireToken(req, res, next) {
  let token
  try {
    token = getAuthToken(req)
    if (!token) {
      beeline.customContext.add("token_present", false)

      res.status(401).send("No auth token provided")
      return
    }
  } catch (e) {
    res.status(400).send(e.message)
    return
  }

  beeline.customContext.add("token_present", true)

  if (expectedToken) {
    if (token === expectedToken) {
      next()
    } else {
      res.status(403).send("Forbidden")
    }
    return
  }

  const response = await fetch(TOKEN_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })
  if (!response.ok) {
    res.status(500).send("Bad response from token endpoint")
    return
  }

  const responseJson = await response.json()

  const expectedMe = new URL(baseUrl).hostname
  const actualMe = new URL(responseJson.me).hostname
  beeline.customContext.add("me", actualMe)

  if (expectedMe !== actualMe) {
    res.status(403).send("Forbidden")
    return
  }

  beeline.customContext.add("scope", responseJson.scope)
  if (responseJson.scope.indexOf("create") >= 0) {
    next()
  } else {
    res.status(403).send("Need create scope")
  }
}

function getAuthToken(req) {
  const authz = req.get("authorization")
  if (!authz) {
    return null
  }

  const [type, token] = authz.split(" ")
  if (type !== "Bearer") {
    throw new Error(`Invalid authorization type '${type}`)
  }

  return token
}
