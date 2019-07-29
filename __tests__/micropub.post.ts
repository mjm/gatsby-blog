jest.mock("../api/micropub/git")

import app from "../api/routes/micropub"
import supertest from "supertest"
import { setExpectedToken } from "../api/micropub/auth"
import { upload, commit } from "../api/micropub/git"
import * as git from "../api/micropub/git"

const url = "/"

// Branch can change depending on environment
process.env.GITHUB_BRANCH = "my-test-branch"

beforeAll(() => setExpectedToken("token"))
afterAll(() => setExpectedToken(null))

beforeAll(() => {
  // @ts-ignore
  git.__registerFile(
    "my-test-branch",
    "src/pages/micro/foo.md",
    `---
templateKey: microblog-post
date: 2019-07-25T19:29:55.878Z
photos:
- https://example.org/baz.jpg
syndication:
- https://www.instagram.com/p/Brv38GxhwXI/
---

Yes! I think this means that TypeScript can add the feature now.

https://twitter.com/drosenwasser/status/1154456633642119168
`
  )
})

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
  expect(mocked(upload).mock.calls).toEqual([[[]]])

  // verify the commit was built correctly
  expect(mocked(commit).mock.calls.length).toBe(1)
  expect(mocked(commit).mock.calls[0][0]).toMatchObject({
    branch: "my-test-branch",
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
  expect(mocked(upload).mock.calls).toEqual([[[]]])

  // verify the commit was built correctly
  expect(mocked(commit).mock.calls.length).toBe(1)
  expect(mocked(commit).mock.calls[0][0]).toMatchObject({
    branch: "my-test-branch",
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
    expect(mocked(upload).mock.calls.length).toBe(1)
    expect(mocked(upload).mock.calls[0][0]).toMatchObject([
      { buffer: Buffer.from("asdf") },
      { buffer: Buffer.from("qwer") },
    ])

    // verify the commit was built correctly
    expect(mocked(commit).mock.calls.length).toBe(1)
    expect(mocked(commit).mock.calls[0][0]).toMatchObject({
      branch: "my-test-branch",
      message: "Added 2018-12-25-a-test-post.md",
      files: [
        { path: "src/pages/micro/2018-12-25-a-test-post.md" },
        { path: new RegExp("^static/media/.+.jpg") },
        { path: new RegExp("^static/media/.+.png") },
      ],
    })
  }
)

test("updates a post", async () => {
  await supertest(app)
    .post(url)
    .set("authorization", "Bearer token")
    .type("json")
    .send({
      action: "update",
      url: "https://www.mattmoriarity.com/foo/",
      add: {
        syndication: ["https://twitter.com/foo/status/1234"],
      },
    })
    .expect(204)

  // call upload, but with no files
  expect(mocked(upload).mock.calls).toEqual([[[]]])

  // verify the commit was built correctly
  expect(mocked(commit).mock.calls.length).toBe(1)
  expect(mocked(commit).mock.calls[0][0]).toMatchInlineSnapshot(`
    Object {
      "branch": "my-test-branch",
      "files": Array [
        Object {
          "content": "---
    templateKey: microblog-post
    date: 2019-07-25T19:29:55.878Z
    photos:
      - 'https://example.org/baz.jpg'
    syndication:
      - 'https://www.instagram.com/p/Brv38GxhwXI/'
      - 'https://twitter.com/foo/status/1234'
    ---

    Yes! I think this means that TypeScript can add the feature now.

    https://twitter.com/drosenwasser/status/1154456633642119168
    ",
          "mode": "100644",
          "path": "src/pages/micro/foo.md",
          "type": "blob",
        },
      ],
      "message": "Updated foo.md",
    }
  `)
})

function mocked<T>(value: T): jest.Mock<T> {
  return (value as unknown) as jest.Mock<T>
}
