const MediaFile = require("../micropub/media")
const MockDate = require("mockdate")

beforeEach(() => {
  MockDate.set(new Date("2018-12-25T00:00:00Z"))
})
afterEach(() => {
  MockDate.reset()
})

test("generates a URL based on date and type", () => {
  const media = new MediaFile({
    buffer: Buffer.from("asdf"),
    mimetype: "image/png",
  })

  expect(media.url).toMatch(new RegExp("^/media/2018/12/[a-f0-9-]+.png$"))
})

test("generates a path by prefixing 'static' to the URL path", () => {
  const media = new MediaFile({
    buffer: Buffer.from("asdf"),
    mimetype: "image/png",
  })

  expect(media.path).toMatch(
    new RegExp("^static/media/2018/12/[a-f0-9-]+.png$")
  )
})
