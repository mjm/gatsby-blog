const nock = require("nock")
const { createRequest, createResponse } = require("node-mocks-http")
const { requireToken } = require("../micropub/auth")

const tokens = {
  correct: [200, { me: "https://www.mattmoriarity.com/", scope: "create" }],
  bad_scope: [200, { me: "https://www.mattmoriarity.com/", scope: "post" }],
  bad_me: [200, { me: "https://example.com/", scope: "create" }],
}

let nockScope
beforeEach(() => {
  nockScope = nock("https://tokens.indieauth.com")
    .get("/token")
    .optionally()
    .reply(function() {
      const token = this.req.headers.authorization[0].substring(7)
      return tokens[token] || [403, "bad token"]
    })
})

afterEach(() => {
  nockScope.done()
})

test("returns 401 if no token is provided", async () => {
  const req = createRequest()
  const res = createResponse()

  await requireToken(req, res)
  expect(res.statusCode).toBe(401)
})

test("returns 400 if a different kind of auth is provided", async () => {
  const req = createRequest({
    headers: { authorization: "Basic foo:bar" },
  })
  const res = createResponse()

  await requireToken(req, res)
  expect(res.statusCode).toBe(400)
})

test("returns 403 if the token is invalid", async () => {
  const req = createRequest({
    headers: { Authorization: "Bearer invalid" },
  })
  const res = createResponse()

  await requireToken(req, res)
  expect(res.statusCode).toBe(403)
})

test("returns 403 if the token is for a different website", async () => {
  const req = createRequest({
    headers: { Authorization: "Bearer bad_me" },
  })
  const res = createResponse()

  await requireToken(req, res)
  expect(res.statusCode).toBe(403)
})

test("returns 403 if the token does not have create scope", async () => {
  const req = createRequest({
    headers: { Authorization: "Bearer bad_scope" },
  })
  const res = createResponse()

  await requireToken(req, res)
  expect(res.statusCode).toBe(403)
})

test("continues otherwise", async () => {
  const req = createRequest({
    headers: { Authorization: "Bearer correct" },
  })
  const res = createResponse()

  const result = await requireToken(req, res)
  expect(result).toBe("next")
})
