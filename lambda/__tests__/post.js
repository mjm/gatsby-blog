const Post = require("../micropub/post.js")

const MockDate = require("mockdate")
const matter = require("gray-matter")

test("exists", () => {
  expect(Post).toBeTruthy()
})

describe("validation", () => {
  test("fails with no type", () => {
    const post = new Post()
    expect(post.validate()).toContainEqual(
      expect.stringContaining("must have a type")
    )
  })

  test("fails with non-entry type", () => {
    const post = new Post()
    post.type = "bookmark"
    expect(post.validate()).toContainEqual(
      expect.stringContaining('type must be "entry"')
    )
  })

  test("passes for entry type", () => {
    const post = new Post()
    post.type = "entry"
    expect(post.validate()).toEqual([])
  })
})

test("undefined content is an empty string", () => {
  const post = new Post()
  expect(post.content).toBe("")

  post.content = "foo bar baz"
  expect(post.content).toBe("foo bar baz")
})

describe("template key", () => {
  test("is microblog-post for title-less posts", () => {
    const post = new Post()
    post.content = "foo bar baz"

    expect(post.templateKey).toBe("microblog-post")

    // empty string shouldn't count either
    post.title = ""
    expect(post.templateKey).toBe("microblog-post")
  })

  test("is blog-post for titled posts", () => {
    const post = new Post()
    post.content = "foo bar baz"
    post.title = "This is a new post"

    expect(post.templateKey).toBe("blog-post")
  })
})

describe("adding media", () => {
  test("adds individual media items to be uploaded", () => {
    const post = new Post()
    post.addMedia("photos", {
      buffer: Buffer.from("asdf"),
      mimetype: "image/jpeg",
    })
    post.addMedia("photos", {
      buffer: Buffer.from("qwer"),
      mimetype: "image/jpeg",
    })

    // check that media to upload is correct
    expect(post.media.length).toBe(2)
    expect(post.media[0].url).toBeDefined()
    expect(post.media[0].buffer).toEqual(Buffer.from("asdf"))
    expect(post.media[1].buffer).toEqual(Buffer.from("qwer"))

    // check that photos is already updated with the URLs
    expect(post.photos).toEqual(post.media.map(m => m.url))
  })

  test("adds an array of media items at once", () => {
    const post = new Post()
    post.addMedia("photos", [
      {
        buffer: Buffer.from("asdf"),
        mimetype: "image/jpeg",
      },
      {
        buffer: Buffer.from("qwer"),
        mimetype: "image/jpeg",
      },
    ])

    // check that media to upload is correct
    expect(post.media.length).toBe(2)
    expect(post.media[0].url).toBeDefined()
    expect(post.media[0].buffer).toEqual(Buffer.from("asdf"))
    expect(post.media[1].buffer).toEqual(Buffer.from("qwer"))

    // check that photos is already updated with the URLs
    expect(post.photos).toEqual(post.media.map(m => m.url))
  })

  test("ignores a falsy file value", () => {
    const post = new Post()
    post.addMedia("photos", undefined)

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
      const post = new Post()
      post.slug = "this-is-my-slug"
      post.generate()

      expect(post.slug).toBe("this-is-my-slug")
    })

    test("slugifies title if present", () => {
      const post = new Post()
      post.title = "This is my new post"
      post.content = "This is some cool content"
      post.generate()

      expect(post.slug).toBe("this-is-my-new-post")
    })

    test("slugifies content if present", () => {
      const post = new Post()
      post.content = "Some cool new content is here."
      post.generate()

      expect(post.slug).toBe("some-cool-new-content-is-here")
    })

    test("slugifies a random string if no title or content is present", () => {
      const post = new Post()
      post.generate()

      expect(post.slug.length).toBeGreaterThan(5)
    })

    test("chops content slug to be less than 40 characters", () => {
      const post = new Post()
      post.content =
        "This is some new content that extends beyond the expected 40 characters"
      post.generate()

      expect(post.slug.length).toBeLessThanOrEqual(40)
      expect(post.slug).toBe("this-is-some-new-content-that-extends")
    })
  })

  describe("the published date", () => {
    test("parses an already set date if present", () => {
      const date = new Date("2019-01-02T03:04:05Z")
      const post = new Post()
      post.published = "2019-01-02T03:04:05Z"
      post.generate()

      expect(post.published).toEqual(date)
    })

    test("uses the current timestamp if no date is set", () => {
      const post = new Post()
      post.generate()

      expect(post.published).toEqual(now)
    })
  })

  describe("the URL", () => {
    test("combines the published date and slug", () => {
      const post = new Post()
      post.published = "2019-01-02T03:04:05Z"
      post.slug = "this-is-a-slug"
      post.generate()

      expect(post.url).toBe("/2019-01-02-this-is-a-slug")
    })

    test("uses generated values correctly", () => {
      const post = new Post()
      post.content = "This is my cool content."
      post.generate()

      expect(post.url).toBe("/2019-05-04-this-is-my-cool-content")
    })
  })

  describe("the file path", () => {
    test("combines the URL and the post type", () => {
      const post = new Post()
      post.title = "A brand new post"
      post.generate()

      expect(post.path).toBe("src/pages/blog/2019-05-04-a-brand-new-post.md")

      const post2 = new Post()
      post2.content = "A little thing I'm cooking up!"
      post2.generate()

      expect(post2.path).toBe(
        "src/pages/micro/2019-05-04-a-little-thing-im-cooking-up.md"
      )
    })
  })
})

describe("rendering", () => {
  test("a minimal post", () => {
    const post = new Post()
    post.content = "This is some content."
    post.published = "2018-01-02T03:04:05Z"
    post.generate()

    const { data, content } = matter(post.render())
    expect(data).toEqual({
      templateKey: "microblog-post",
      date: new Date("2018-01-02T03:04:05.000Z"),
    })
    expect(content.trim()).toBe("This is some content.")
  })

  test("a post with title and photos", () => {
    const post = new Post()
    post.content = "This is my sweet blog post."
    post.published = "2018-01-02T03:04:05Z"
    post.title = "A New Post"
    post.photos = ["/media/1.jpg", "/media/2.jpg"]
    post.generate()

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
    const post = new Post()
    post.published = "2018-01-02T03:04:05Z"
    post.photos = ["/media/1.jpg"]
    post.generate()

    const { data, content } = matter(post.render())
    expect(data).toEqual({
      templateKey: "microblog-post",
      date: new Date("2018-01-02T03:04:05.000Z"),
      photos: ["/media/1.jpg"],
    })
    expect(content.trim()).toBe("")
  })
})
