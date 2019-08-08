import express from "express"
import promiseRouter from "express-promise-router"
import supertest from "supertest"
import nock from "nock"
import { requireToken } from "../lib/auth"

// create small test app that uses the middleware
const app = express()
const router = promiseRouter()
router.use(requireToken)
router.get("*", (_req, res) => {
  res.status(200).send("OK")
})
app.use(router)

const tokens: { [key: string]: [number, any] } = {
  correct: [200, { me: "https://www.mattmoriarity.com/", scope: "create" }],
  bad_me: [200, { me: "https://example.com/", scope: "create" }],
  bad_response: [500, "An internal error happened on the token endpoint"],
}

let nockScope: nock.Scope
beforeEach(() => {
  nockScope = nock("https://tokens.indieauth.com")
    .get("/token")
    .optionally()
    .reply(function() {
      // @ts-ignore
      const token = this.req.headers.authorization[0].substring(7)
      return tokens[token] || [403, "bad token"]
    })
})

afterEach(() => {
  nockScope.done()
})

test("returns 401 if no token is provided", async () => {
  await supertest(app)
    .get("/")
    .expect(401, /no auth token provided/)
})

test("returns 400 if a different kind of auth is provided", async () => {
  await supertest(app)
    .get("/")
    .set("authorization", "Basic foo:bar")
    .expect(400)
})

test("returns 403 if the token is invalid", async () => {
  await supertest(app)
    .get("/")
    .set("authorization", "Bearer invalid")
    .expect(403)
})

test("returns 403 if the token is for a different website", async () => {
  await supertest(app)
    .get("/")
    .set("authorization", "Bearer bad_me")
    .expect(403)
})

test("returns 500 if the token endpoint gives a bad response", async () => {
  await supertest(app)
    .get("/")
    .set("authorization", "Bearer bad_response")
    .expect(500)
})

test("continues otherwise", async () => {
  await supertest(app)
    .get("/")
    .set("authorization", "Bearer correct")
    .expect(200, "OK")
})
