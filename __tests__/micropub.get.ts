import app from "../api/micropub"
import supertest from "supertest"
import { setExpectedToken } from "../lib/auth"

const url = "/"

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
    "https://gatsby-blog.mjm.now.sh/api/micropub/media"
  )
})

test("other q values give an error", async () => {
  await supertest(app)
    .get(url)
    .set("authorization", "Bearer token")
    .query({ q: "foobar" })
    .expect(400)
})
