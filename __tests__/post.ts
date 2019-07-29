jest.mock("../api/micropub/git")

import { Post } from "../api/micropub/post"
import * as git from "../api/micropub/git"

import MockDate from "mockdate"
import matter from "gray-matter"

describe("validation", () => {
  test("fails with no type", () => {
    const pb = Post.build()
    expect(() => pb.generate()).toThrow(/type must be 'entry'/)
  })

  test("fails with non-entry type", () => {
    const pb = Post.build()
    pb.type = "bookmark"
    expect(() => pb.generate()).toThrow(/type must be 'entry'/)
  })

  test("passes for entry type", () => {
    const pb = Post.build()
    pb.type = "entry"
    expect(() => pb.generate()).not.toThrow(/type must be 'entry'/)
  })
})

test("undefined content is an empty string", () => {
  const pb = Post.build({ type: "entry" })

  expect(pb.generate().content).toBe("")

  pb.content = "foo bar baz"
  expect(pb.generate().content).toBe("foo bar baz")
})

describe("adding media", () => {
  test("adds individual media items to be uploaded", () => {
    const pb = Post.build({ type: "entry" })
    pb.addMedia("photos", createFile("asdf"))
    pb.addMedia("photos", createFile("qwer"))
    const post = pb.generate()

    // check that media to upload is correct
    expect(post.media.length).toBe(2)
    expect(post.media[0].url).toBeDefined()
    expect(post.media[0].buffer).toEqual(Buffer.from("asdf"))
    expect(post.media[1].buffer).toEqual(Buffer.from("qwer"))

    // check that photos is already updated with the URLs
    expect(post.photos).toEqual(post.media.map(m => m.url))
  })

  test("adds an array of media items at once", () => {
    const pb = Post.build({ type: "entry" })
    pb.addMedia("photos", [createFile("asdf"), createFile("qwer")])
    const post = pb.generate()

    // check that media to upload is correct
    expect(post.media.length).toBe(2)
    expect(post.media[0].url).toBeDefined()
    expect(post.media[0].buffer).toEqual(Buffer.from("asdf"))
    expect(post.media[1].buffer).toEqual(Buffer.from("qwer"))

    // check that photos is already updated with the URLs
    expect(post.photos).toEqual(post.media.map(m => m.url))
  })

  test("ignores a falsy file value", () => {
    const pb = Post.build({ type: "entry" })
    pb.addMedia("photos", undefined)
    const post = pb.generate()

    expect(post.media).toEqual([])
  })
})

describe("generating", () => {
  const now = new Date("2019-05-04T03:02:01Z")

  beforeEach(() => {
    MockDate.set(now)
  })

  afterEach(() => {
    MockDate.reset()
  })

  describe("the slug", () => {
    test("uses already set slug if present", () => {
      const pb = Post.build({ type: "entry" })
      pb.slug = "this-is-my-slug"
      const post = pb.generate()

      expect(post.url).toMatch(/this-is-my-slug$/)
    })

    test("slugifies title if present", () => {
      const pb = Post.build({ type: "entry" })
      pb.title = "This is my new post"
      pb.content = "This is some cool content"
      const post = pb.generate()

      expect(post.url).toMatch(/this-is-my-new-post$/)
    })

    test("slugifies content if present", () => {
      const pb = Post.build({ type: "entry" })
      pb.content = "Some cool new content is here."
      const post = pb.generate()

      expect(post.url).toMatch(/some-cool-new-content-is-here$/)
    })

    test("slugifies a random string if no title or content is present", () => {
      const pb = Post.build({ type: "entry" })
      const post = pb.generate()

      expect(post.url.length).toBeGreaterThan(5)
    })

    test("chops content slug to be less than 40 characters", () => {
      const pb = Post.build({ type: "entry" })
      pb.content =
        "This is some new content that extends beyond the expected 40 characters"
      const post = pb.generate()

      expect(post.url).toMatch(/this-is-some-new-content-that-extends$/)
    })
  })

  describe("the published date", () => {
    test("parses an already set date if present", () => {
      const date = new Date("2019-01-02T03:04:05Z")
      const pb = Post.build({ type: "entry" })
      pb.published = "2019-01-02T03:04:05Z"
      const post = pb.generate()

      expect(post.published).toEqual(date)
    })

    test("uses the current timestamp if no date is set", () => {
      const pb = Post.build({ type: "entry" })
      const post = pb.generate()

      expect(post.published).toEqual(now)
    })
  })

  describe("the URL", () => {
    test("combines the published date and slug", () => {
      const pb = Post.build({ type: "entry" })
      pb.published = "2019-01-02T03:04:05Z"
      pb.slug = "this-is-a-slug"
      const post = pb.generate()

      expect(post.url).toBe("/2019-01-02-this-is-a-slug")
    })

    test("uses generated values correctly", () => {
      const pb = Post.build({ type: "entry" })
      pb.content = "This is my cool content."
      const post = pb.generate()

      expect(post.url).toBe("/2019-05-04-this-is-my-cool-content")
    })
  })

  describe("the file path", () => {
    test("combines the URL and the post type", () => {
      const pb = Post.build({ type: "entry" })
      pb.title = "A brand new post"
      const post = pb.generate()

      expect(post.path).toBe("src/pages/blog/2019-05-04-a-brand-new-post.md")

      const pb2 = Post.build({ type: "entry" })
      pb2.content = "A little thing I'm cooking up!"
      const post2 = pb2.generate()

      expect(post2.path).toBe(
        "src/pages/micro/2019-05-04-a-little-thing-im-cooking-up.md"
      )
    })
  })
})

describe("rendering", () => {
  test("a minimal post", () => {
    const pb = Post.build({ type: "entry" })
    pb.content = "This is some content."
    pb.published = "2018-01-02T03:04:05Z"
    const post = pb.generate()

    const { data, content } = matter(post.render())
    expect(data).toEqual({
      templateKey: "microblog-post",
      date: new Date("2018-01-02T03:04:05.000Z"),
    })
    expect(content.trim()).toBe("This is some content.")
  })

  test("a post with title and photos", () => {
    const pb = Post.build({ type: "entry" })
    pb.content = "This is my sweet blog post."
    pb.published = "2018-01-02T03:04:05Z"
    pb.title = "A New Post"
    pb.photos = ["/media/1.jpg", "/media/2.jpg"]
    const post = pb.generate()

    const { data, content } = matter(post.render())
    expect(data).toEqual({
      templateKey: "blog-post",
      date: new Date("2018-01-02T03:04:05.000Z"),
      title: "A New Post",
      photos: ["/media/1.jpg", "/media/2.jpg"],
    })
    expect(content.trim()).toBe("This is my sweet blog post.")
  })

  test("a post with no content", () => {
    const pb = Post.build({ type: "entry" })
    pb.published = "2018-01-02T03:04:05Z"
    pb.photos = ["/media/1.jpg"]
    const post = pb.generate()

    const { data, content } = matter(post.render())
    expect(data).toEqual({
      templateKey: "microblog-post",
      date: new Date("2018-01-02T03:04:05.000Z"),
      photos: ["/media/1.jpg"],
    })
    expect(content.trim()).toBe("")
  })
})

describe("fetching", () => {
  beforeAll(() => {
    // @ts-ignore
    git.__registerFile(
      "my-branch",
      "src/pages/micro/foo-bar-baz.md",
      `---
templateKey: microblog-post
date: 2019-07-25T19:29:55.878Z
---

Yes! I think this means that TypeScript can add the feature now.

https://twitter.com/drosenwasser/status/1154456633642119168
`
    )
    // @ts-ignore
    git.__registerFile(
      "my-branch",
      "src/pages/blog/baz-bar-foo.md",
      `---
templateKey: blog-post
title: Baz Bar Foo
date: 2019-07-25T19:29:55.878Z
---

Content goes here.
`
    )
  })

  test("a microblog post", async () => {
    const post = await Post.fetch(
      "my-branch",
      "https://example.com/foo-bar-baz/"
    )
    expect(post).toMatchInlineSnapshot(`
      Post {
        "content": "Yes! I think this means that TypeScript can add the feature now.

      https://twitter.com/drosenwasser/status/1154456633642119168
      ",
        "exists": true,
        "media": Array [],
        "path": "src/pages/micro/foo-bar-baz.md",
        "photos": Array [],
        "published": 2019-07-25T19:29:55.878Z,
        "syndication": Array [],
        "title": "",
        "type": "entry",
        "url": "/foo-bar-baz",
      }
    `)
  })

  test("a blog post", async () => {
    const post = await Post.fetch(
      "my-branch",
      "https://example.com/baz-bar-foo"
    )
    expect(post).toMatchInlineSnapshot(`
      Post {
        "content": "Content goes here.
      ",
        "exists": true,
        "media": Array [],
        "path": "src/pages/blog/baz-bar-foo.md",
        "photos": Array [],
        "published": 2019-07-25T19:29:55.878Z,
        "syndication": Array [],
        "title": "Baz Bar Foo",
        "type": "entry",
        "url": "/baz-bar-foo",
      }
    `)
  })

  test("a post that doesn't exist", async () => {
    expect(
      Post.fetch("my-branch", "https://example.com/not-found")
    ).rejects.toThrowError()
  })

  test("a post from a different branch", async () => {
    expect(
      Post.fetch("my-other-branch", "https://example.com/baz-bar-foo")
    ).rejects.toThrowError()
  })
})

function createFile(
  bufferStr: string,
  mimetype: string = "image/jpeg"
): Express.Multer.File {
  return {
    buffer: Buffer.from(bufferStr),
    mimetype,
    fieldname: "photo",
    originalname: "foo.jpg",
    size: bufferStr.length,
    encoding: "utf8",
    filename: "",
    destination: "",
    path: "",
  }
}
