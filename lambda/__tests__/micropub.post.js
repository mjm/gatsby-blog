jest.mock("../micropub/git")

const app = require("../micropub/app")
const supertest = require("supertest")
const { setExpectedToken } = require("../micropub/auth")
const { upload, commit } = require("../micropub/git")

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

  // call upload, but with no files
  expect(upload.mock.calls).toEqual([[[]]])

  // verify the commit was built correctly
  expect(commit.mock.calls.length).toBe(1)
  expect(commit.mock.calls[0][0]).toMatchObject({
    branch: "master",
    message: "Added 2018-12-25-a-test-post.md",
    files: [{ path: "src/pages/micro/2018-12-25-a-test-post.md" }],
  })
})

test("creates a JSON-based post", async () => {
  await supertest(app)
    .post(url)
    .set("authorization", "Bearer token")
    .type("json")
    .send({
      type: ["h-entry"],
      properties: {
        content: ["A test post!"],
        published: ["2018-12-25T00:00:00Z"],
      },
    })
    .expect(202)
    .expect("Location", "https://www.mattmoriarity.com/2018-12-25-a-test-post/")

  // call upload, but with no files
  expect(upload.mock.calls).toEqual([[[]]])

  // verify the commit was built correctly
  expect(commit.mock.calls.length).toBe(1)
  expect(commit.mock.calls[0][0]).toMatchObject({
    branch: "master",
    message: "Added 2018-12-25-a-test-post.md",
    files: [{ path: "src/pages/micro/2018-12-25-a-test-post.md" }],
  })
})

test.each(["photo", "photo[]"])(
  "create a multipart post with photos in the '%s' key",
  async key => {
    await supertest(app)
      .post(url)
      .set("authorization", "Bearer token")
      .field("h", "entry")
      .field("content", "A test post!")
      .field("published", "2018-12-25T00:00:00Z")
      .attach(key, Buffer.from("asdf"), "1.jpg")
      .attach(key, Buffer.from("qwer"), "2.png")
      .expect(202)
      .expect(
        "Location",
        "https://www.mattmoriarity.com/2018-12-25-a-test-post/"
      )

    // call upload, but with no files
    expect(upload.mock.calls.length).toBe(1)
    expect(upload.mock.calls[0][0]).toMatchObject([
      { buffer: Buffer.from("asdf") },
      { buffer: Buffer.from("qwer") },
    ])

    // verify the commit was built correctly
    expect(commit.mock.calls.length).toBe(1)
    expect(commit.mock.calls[0][0]).toMatchObject({
      branch: "master",
      message: "Added 2018-12-25-a-test-post.md",
      files: [
        { path: "src/pages/micro/2018-12-25-a-test-post.md" },
        { path: new RegExp("^static/media/.+.jpg") },
        { path: new RegExp("^static/media/.+.png") },
      ],
    })
  }
)
