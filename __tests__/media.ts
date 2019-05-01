import MediaFile from "../api/micropub/media"
import MockDate from "mockdate"

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

test("computes the OID using the SHA256 of the buffer", () => {
  const media = new MediaFile({
    buffer: Buffer.from("asdf"),
    mimetype: "image/png",
  })

  expect(media.oid).toBe(
    "f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b"
  )
})

test("computes the size of the buffer", () => {
  const media = new MediaFile({
    buffer: Buffer.from("asdf"),
    mimetype: "image/png",
  })

  expect(media.size).toBe(4)
})
