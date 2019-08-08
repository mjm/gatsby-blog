import nock from "nock"
import { CommitFile, setRepo, commit, upload, getFile } from "../lib/git"
import MediaFile from "../lib/media"

beforeAll(() => {
  setRepo("foo", "bar")
  nock.disableNetConnect()
})
afterAll(() => {
  nock.cleanAll()
  nock.enableNetConnect()
})

describe("committing to GitHub", () => {
  test("makes no request when given no files", async () => {
    await commit({
      branch: "master",
      message: "Foo bar",
      files: [],
    })
  })

  test("makes a commit to the specified branch", async () => {
    const files: CommitFile[] = [
      { path: "foo.md", content: "Foo bar!", mode: "100644", type: "blob" },
      {
        path: "media/bar.jpg",
        content: "An LFS pointer here",
        mode: "100644",
        type: "blob",
      },
    ]

    const scope = nock(/api.github.com/)
      .defaultReplyHeaders({ "access-control-allow-origin": "*" })
      .get("/repos/foo/bar/branches/my-branch")
      .reply(200, {
        commit: {
          sha: "1234567",
          commit: {
            tree: { sha: "abcdef1" },
          },
        },
      })
      .post("/repos/foo/bar/git/trees", { tree: files, base_tree: "abcdef1" })
      .reply(201, { sha: "7654321" })
      .post("/repos/foo/bar/git/commits", {
        message: "My commit message",
        tree: "7654321",
        parents: ["1234567"],
      })
      .reply(201, { sha: "2345678" })
      .patch("/repos/foo/bar/git/refs/heads/my-branch", {
        sha: "2345678",
        force: false,
      })
      .reply(200, {})

    await commit({
      branch: "my-branch",
      message: "My commit message",
      files,
    })

    scope.done()
  })
})

describe("getting a file from GitHub", () => {
  it("gets a file that exists in the branch", async () => {
    const scope = nock(/api.github.com/)
      .defaultReplyHeaders({ "access-control-allow-origin": "*" })
      .get("/repos/foo/bar/contents/a/b/c.md")
      .query({ ref: "my-branch" })
      .reply(200, "this is my file contents")

    const contents = await getFile("my-branch", "a/b/c.md")
    expect(contents).toEqual("this is my file contents")

    scope.done()
  })

  it("throws an error if the file does not exist", async () => {
    const scope = nock(/api.github.com/)
      .defaultReplyHeaders({ "access-control-allow-origin": "*" })
      .get("/repos/foo/bar/contents/a/b/c.md")
      .query({ ref: "my-branch" })
      .reply(404, {
        message: "Not Found",
        documentation_url:
          "https://developer.github.com/v3/repos/contents/#get-contents",
      })

    await expect(getFile("my-branch", "a/b/c.md")).rejects.toThrowError()

    scope.done()
  })
})

describe("uploading to Git LFS", () => {
  const lfsServer = new RegExp("//www.mattmoriarity.com")

  test("makes no request when given no files", async () => {
    // because we've disable net connect in nock, this should throw an error if a request
    // is made, since we didn't set up any interceptors
    await upload([])
  })

  test("does not upload anything if files are already present", async () => {
    const file1 = new MediaFile({ buffer: Buffer.from("asdf"), mimetype: "" })
    const file2 = new MediaFile({ buffer: Buffer.from("qwer"), mimetype: "" })

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
    const file1 = new MediaFile({ buffer: Buffer.from("asdf"), mimetype: "" })
    const file2 = new MediaFile({ buffer: Buffer.from("qwer"), mimetype: "" })

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
