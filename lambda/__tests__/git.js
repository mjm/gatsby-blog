const nock = require("nock")
const { commit, upload } = require("../micropub/git")
const MediaFile = require("../micropub/media")

beforeAll(() => {
  nock.disableNetConnect()
})
afterAll(() => {
  nock.cleanAll()
  nock.enableNetConnect()
})

describe("committing to GitHub", () => {})

describe("uploading to Git LFS", () => {
  const lfsServer = new RegExp("//www.mattmoriarity.com")

  test("makes no request when given no files", async () => {
    // because we've disable net connect in nock, this should throw an error if a request
    // is made, since we didn't set up any interceptors
    await upload([])
  })

  test("does not upload anything if files are already present", async () => {
    const file1 = new MediaFile({ buffer: Buffer.from("asdf") })
    const file2 = new MediaFile({ buffer: Buffer.from("qwer") })

    const scope = nock(lfsServer)
      .matchHeader("accept", "application/vnd.git-lfs+json")
      .matchHeader("content-type", "application/vnd.git-lfs+json")
      .post("/.netlify/large-media/objects/batch", {
        operation: "upload",
        transfers: ["basic"],
        objects: [{ oid: file1.oid, size: 4 }, { oid: file2.oid, size: 4 }],
      })
      .reply(200, {
        transfer: "basic",
        objects: [{ oid: file1.oid, size: 4 }, { oid: file2.oid, size: 4 }],
      })

    await upload([file1, file2])
    scope.done()
  })

  test("performs upload if a file is given an upload URL", async () => {
    const file1 = new MediaFile({ buffer: Buffer.from("asdf") })
    const file2 = new MediaFile({ buffer: Buffer.from("qwer") })

    const scope = nock(lfsServer)
      .post("/.netlify/large-media/objects/batch", {
        operation: "upload",
        transfers: ["basic"],
        objects: [{ oid: file1.oid, size: 4 }, { oid: file2.oid, size: 4 }],
      })
      .reply(200, {
        transfer: "basic",
        objects: [
          { oid: file1.oid, size: 4 },
          {
            oid: file2.oid,
            size: 4,
            actions: {
              upload: {
                href: "https://example.com/upload/2",
                header: {
                  Authorization: "Bearer token",
                },
              },
            },
          },
        ],
      })

    const uploadScope = nock("https://example.com")
      .matchHeader("Authorization", "Bearer token")
      .put("/upload/2", Buffer.from("qwer"))
      .reply(200, "")

    await upload([file1, file2])
    scope.done()
    uploadScope.done()
  })
})
