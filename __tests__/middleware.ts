jest.mock("../api/micropub/git")

import { createRequest, createResponse } from "node-mocks-http"
import * as mw from "../api/micropub/middleware"
import * as git from "../api/micropub/git"

process.env.GITHUB_BRANCH = "my-test-branch"

function setup(type: string, body: any, files: any = {}) {
  const req = createRequest({
    headers: {
      "content-type": type,
      // type-is needs this to believe that the request had a body
      "content-length": "100",
    },
    body,
    files,
  })
  const res = createResponse({ req })

  return { req, res }
}

function createFile() {
  return {
    buffer: Buffer.from(""),
    mimetype: "image/jpeg",
  }
}

const formType = "application/x-www-form-urlencoded"
const multipartType = "multipart/form-data"
const jsonType = "application/json"

describe("reading a form-based Micropub request", () => {
  test("does nothing when the request is not a form", async () => {
    const { req, res } = setup(jsonType, {
      type: "h-entry",
      properties: {},
    })

    await mw.form(req, res)
    expect(req.post).toBe(undefined)
  })

  test("reads the type from the h key", async () => {
    const { req, res } = setup(formType, { h: "entry" })

    await mw.form(req, res)
    expect(req.post.type).toBe("entry")
  })

  test("returns a 400 response if the type is wrong", async () => {
    const { req, res } = setup(formType, { h: "bookmark" })

    const result = mw.form(req, res)
    await expect(result).rejects.toThrow(/type must be 'entry'/)
    await expect(result).rejects.toHaveProperty("statusCode", 400)
  })

  test("reads the title from the name key", async () => {
    const { req, res } = setup(formType, {
      h: "entry",
      name: "Post title here",
    })

    await mw.form(req, res)
    expect(req.post.title).toBe("Post title here")
  })

  test("reads the content from the content key", async () => {
    const { req, res } = setup(formType, {
      h: "entry",
      content: "This is my test post.",
    })

    await mw.form(req, res)
    expect(req.post.content).toBe("This is my test post.")
  })

  test("reads the slug from the mp-slug key", async () => {
    const { req, res } = setup(formType, {
      h: "entry",
      "mp-slug": "this-is-my-slug",
    })

    await mw.form(req, res)
    expect(req.post.url).toMatch(/this-is-my-slug$/)
  })

  test("reads the published date from the published key", async () => {
    const { req, res } = setup(formType, {
      h: "entry",
      published: "2018-12-25T01:02:03Z",
    })

    await mw.form(req, res)
    expect(req.post.published).toEqual(new Date("2018-12-25T01:02:03Z"))
  })

  test("reads single photo URL from the photo key", async () => {
    const { req, res } = setup(formType, {
      h: "entry",
      photo: "https://example.com/1.jpg",
    })

    await mw.form(req, res)
    expect(req.post.photos).toEqual(["https://example.com/1.jpg"])
  })

  test("reads multiple photo URLs from the photo key", async () => {
    const { req, res } = setup(formType, {
      h: "entry",
      photo: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
    })

    await mw.form(req, res)
    expect(req.post.photos).toEqual([
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
    ])
    expect(req.post.media).toEqual([])
  })

  test("reads photo files from the photo key", async () => {
    const { req, res } = setup(
      multipartType,
      { h: "entry" },
      { photo: [createFile(), createFile()] }
    )

    await mw.form(req, res)
    expect(req.post.media.length).toBe(2)
    expect(req.post.photos.length).toBe(2)
  })

  test("reads photo files from the photo[] key", async () => {
    const { req, res } = setup(
      multipartType,
      { h: "entry" },
      { "photo[]": [createFile(), createFile()] }
    )

    await mw.form(req, res)
    expect(req.post.media.length).toBe(2)
    expect(req.post.photos.length).toBe(2)
  })
})

describe("reading a JSON Micropub request", () => {
  describe("a create request", () => {
    test("does nothing when the request is not JSON", async () => {
      const { req, res } = setup(formType, {
        h: "entry",
      })

      await mw.json(req, res)
      expect(req.post).toBe(undefined)
    })

    test("reads the type from the type key", async () => {
      const { req, res } = setup(jsonType, {
        type: ["h-entry"],
        properties: {},
      })

      await mw.json(req, res)
      expect(req.post.type).toBe("entry")
    })

    test("returns a 400 response if the type is wrong", async () => {
      const { req, res } = setup(jsonType, {
        type: ["h-bookmark"],
        properties: {},
      })

      const result = mw.json(req, res)
      await expect(result).rejects.toThrow(/type must be 'entry'/)
      await expect(result).rejects.toHaveProperty("statusCode", 400)
    })

    test("reads the title from the name key", async () => {
      const { req, res } = setup(jsonType, {
        type: ["h-entry"],
        properties: { name: ["Post title here"] },
      })

      await mw.json(req, res)
      expect(req.post.title).toBe("Post title here")
    })

    test("reads the content from the content key", async () => {
      const { req, res } = setup(jsonType, {
        type: ["h-entry"],
        properties: { content: ["This is my post content."] },
      })

      await mw.json(req, res)
      expect(req.post.content).toBe("This is my post content.")
    })

    test("reads the slug from the mp-slug key", async () => {
      const { req, res } = setup(jsonType, {
        type: ["h-entry"],
        properties: { "mp-slug": ["this-is-my-slug"] },
      })

      await mw.json(req, res)
      expect(req.post.url).toMatch(/this-is-my-slug$/)
    })

    test("reads the published date from the published key", async () => {
      const { req, res } = setup(jsonType, {
        type: ["h-entry"],
        properties: { published: ["2018-12-25T01:02:03Z"] },
      })

      await mw.json(req, res)
      expect(req.post.published).toEqual(new Date("2018-12-25T01:02:03Z"))
    })

    test("reads photo URLs from the photo key", async () => {
      const { req, res } = setup(jsonType, {
        type: ["h-entry"],
        properties: {
          photo: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
        },
      })

      await mw.json(req, res)
      expect(req.post.photos).toEqual([
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
      ])
    })
  })

  describe("an update request", () => {
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
---

Yes! I think this means that TypeScript can add the feature now.

https://twitter.com/drosenwasser/status/1154456633642119168
`
      )
    })

    test("errors if there are no actions to perform", async () => {
      const { req, res } = setup(jsonType, {
        action: "update",
        url: "https://example.com/foo",
      })

      await expect(
        mw.json(req, res)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"No changes specified for update"`
      )
    })

    test("allows replacing the title", async () => {
      const { req, res } = setup(jsonType, {
        action: "update",
        url: "https://example.com/foo",
        replace: {
          name: ["A new post title"],
        },
      })

      await mw.json(req, res)
      expect(req.post).toMatchInlineSnapshot(`
        Post {
          "content": "Yes! I think this means that TypeScript can add the feature now.

        https://twitter.com/drosenwasser/status/1154456633642119168
        ",
          "media": Array [],
          "path": "src/pages/micro/foo.md",
          "photos": Array [
            "https://example.org/baz.jpg",
          ],
          "published": 2019-07-25T19:29:55.878Z,
          "title": "A new post title",
          "type": "entry",
          "url": "/foo",
        }
      `)
    })

    test("allows replacing the content", async () => {
      const { req, res } = setup(jsonType, {
        action: "update",
        url: "https://example.com/foo",
        replace: {
          content: ["This is the new post content."],
        },
      })

      await mw.json(req, res)
      expect(req.post).toMatchInlineSnapshot(`
        Post {
          "content": "This is the new post content.",
          "media": Array [],
          "path": "src/pages/micro/foo.md",
          "photos": Array [
            "https://example.org/baz.jpg",
          ],
          "published": 2019-07-25T19:29:55.878Z,
          "title": "",
          "type": "entry",
          "url": "/foo",
        }
      `)
    })

    test("allows adding photos", async () => {
      const { req, res } = setup(jsonType, {
        action: "update",
        url: "https://example.com/foo",
        add: {
          photo: ["https://example.com/foo.jpg", "https://example.org/bar.png"],
        },
      })

      await mw.json(req, res)
      expect(req.post).toMatchInlineSnapshot(`
        Post {
          "content": "Yes! I think this means that TypeScript can add the feature now.

        https://twitter.com/drosenwasser/status/1154456633642119168
        ",
          "media": Array [],
          "path": "src/pages/micro/foo.md",
          "photos": Array [
            "https://example.org/baz.jpg",
            "https://example.com/foo.jpg",
            "https://example.org/bar.png",
          ],
          "published": 2019-07-25T19:29:55.878Z,
          "title": "",
          "type": "entry",
          "url": "/foo",
        }
      `)
    })
  })
})
