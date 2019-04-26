const Post = require("../micropub/post.js")

const MockDate = require("mockdate")

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