const app = require("../micropub/app")
const supertest = require("supertest")
const { setExpectedToken } = require("../micropub/auth")

jest.mock("../micropub/commits")
const { CommitBuilder } = require("../micropub/commits")

const url = "/.netlify/functions/micropub"

beforeAll(() => setExpectedToken("token"))
afterAll(() => setExpectedToken(null))

test("requires a valid token", async () => {
  await supertest(app)
    .post(url)
    .expect(401)

  await supertest(app)
    .post(url)
    .set("authorization", "Bearer bad_token")
    .expect(403)
})

test("creates a form-based post with no photos", async () => {
  await supertest(app)
    .post(url)
    .set("authorization", "Bearer token")
    .type("application/x-www-form-urlencoded")
    .send({
      h: "entry",
      content: "A test post!",
      published: "2018-12-25T00:00:00Z",
    })
    .expect(202)
    .expect("Location", "https://www.mattmoriarity.com/2018-12-25-a-test-post/")

  const commit = CommitBuilder.instances[0]
  expect(commit.files).toMatchObject([
    { path: "src/pages/micro/2018-12-25-a-test-post.md" },
  ])
  expect(commit.commit.mock.calls[0]).toEqual([
    "Added 2018-12-25-a-test-post.md",
  ])
})

test("creates a JSON-based post", async () => {
  await supertest(app)
    .post(url)
    .set("authorization", "Bearer token")
    .type("json")
    .send({
      type: "h-entry",
      properties: {
        content: ["A test post!"],
        published: ["2018-12-25T00:00:00Z"],
      },
    })
    .expect(202)
    .expect("Location", "https://www.mattmoriarity.com/2018-12-25-a-test-post/")

  const commit = CommitBuilder.instances[0]
  expect(commit.files).toMatchObject([
    { path: "src/pages/micro/2018-12-25-a-test-post.md" },
  ])
  expect(commit.commit.mock.calls[0]).toEqual([
    "Added 2018-12-25-a-test-post.md",
  ])
})
