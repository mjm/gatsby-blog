const app = require("../micropub/app")
const supertest = require("supertest")
const { setExpectedToken } = require("../micropub/auth")

const url = "/.netlify/functions/micropub"

beforeAll(() => setExpectedToken("token"))
afterAll(() => setExpectedToken(null))

test("requires a valid token", async () => {
  await supertest(app)
    .get(url)
    .expect(401)

  await supertest(app)
    .get(url)
    .set("authorization", "Bearer bad_token")
    .expect(403)
})

test("no q value gives an error", async () => {
  await supertest(app)
    .get(url)
    .set("authorization", "Bearer token")
    .expect(400)
})

test("q=config gives the media endpoint", async () => {
  const { body } = await supertest(app)
    .get(url)
    .set("authorization", "Bearer token")
    .query({ q: "config" })
    .expect(200)
    .expect("content-type", /json/)

  expect(body["media-endpoint"]).toBe(
    "https://www.mattmoriarity.com/.netlify/functions/micropub/media"
  )
})

test("other q values give an error", async () => {
  await supertest(app)
    .get(url)
    .set("authorization", "Bearer token")
    .query({ q: "foobar" })
    .expect(400)
})
