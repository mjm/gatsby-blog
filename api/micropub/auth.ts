import beeline from "./honeycomb"
import { URL } from "url"
import fetch from "node-fetch"
import express from "express"
import httpError from "http-errors"
import { baseUrl } from "./config"

const TOKEN_URL = "https://tokens.indieauth.com/token"

let expectedToken: string | null = null

export const setExpectedToken = (token: string | null) => {
  expectedToken = token
}

export async function requireToken(req: express.Request) {
  const token = getAuthToken(req)
  if (!token) {
    beeline.customContext.add("token_present", false)
    throw new httpError.Unauthorized("no auth token provided")
  }

  beeline.customContext.add("token_present", true)

  if (expectedToken) {
    if (token === expectedToken) {
      return "next"
    } else {
      throw new httpError.Forbidden("you are forbidden")
    }
  }

  const response = await fetch(TOKEN_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  if (response.status === 403) {
    throw new httpError.Forbidden("token endpoint rejected token")
  }
  if (!response.ok) {
    throw new httpError.InternalServerError("bad response from token endpoint")
  }

  const responseJson = await response.json()

  const expectedMe = new URL(baseUrl).hostname
  const actualMe = new URL(responseJson.me).hostname
  beeline.customContext.add("me", actualMe)

  if (expectedMe !== actualMe) {
    throw new httpError.Forbidden(
      "you are not the person allowed to use this API"
    )
  }

  beeline.customContext.add("scope", responseJson.scope)
  if (responseJson.scope.indexOf("create") >= 0) {
    return "next"
  } else {
    throw new httpError.Forbidden("'create' scope is required")
  }
}

function getAuthToken(req: express.Request) {
  const authz = req.get("authorization")
  if (!authz) {
    return null
  }

  const [type, token] = authz.split(" ")
  if (type !== "Bearer") {
    throw new httpError.BadRequest(
      `invalid authorization type '${type}', only 'Bearer' is supported`
    )
  }

  return token
}
