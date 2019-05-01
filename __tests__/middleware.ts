import { createRequest, createResponse } from "node-mocks-http"
import * as mw from "../api/micropub/middleware"

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
    expect(req.post.slug).toBe("this-is-my-slug")
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
    expect(req.post.slug).toBe("this-is-my-slug")
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
