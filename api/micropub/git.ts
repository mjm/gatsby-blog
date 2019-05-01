import beeline from "./honeycomb"
import fetch from "node-fetch"
import GitHub from "github-api"
import MediaFile from "./media"

const gh = new GitHub({ token: process.env.GITHUB_TOKEN })
const lfsUrl = `https://access-token:${
  process.env.NETLIFY_TOKEN
}@www.mattmoriarity.com/.netlify/large-media`

let repo = gh.getRepo(process.env.GITHUB_USER, process.env.GITHUB_REPO)

export function setRepo(user: string, name: string) {
  repo = gh.getRepo(user, name)
}

export interface CommitFile {
  path: string
  content: string
  mode: string
  type: "blob"
}

export interface Commit {
  branch: string
  message: string
  files: CommitFile[]
}

export async function commit({
  branch,
  message,
  files,
}: Commit): Promise<void> {
  if (!files.length) {
    return
  }

  beeline.addContext({
    "app.commit.message": message,
    "app.commit.branch": branch,
    "app.commit.files": files.length,
  })

  const branchInfo = await _getBranch(branch)
  const parentCommit = branchInfo.commit.sha
  beeline.customContext.add("commit.old_sha", parentCommit)

  const parentTree = branchInfo.commit.commit.tree.sha
  beeline.customContext.add("commit.old_tree_sha", parentTree)

  const { sha: treeSha } = await _createTree(parentTree, files)
  beeline.customContext.add("commit.new_tree_sha", treeSha)

  await _createCommit(branch, parentCommit, treeSha, message)
}

export async function upload(files: MediaFile[]): Promise<void> {
  if (!files.length) {
    return
  }

  await _initiateTransfer(files)
  for (const file of files) {
    await _uploadFile(file)
  }
}

async function _getBranch(branch: string) {
  const response = await repo.getBranch(branch)
  return response.data
}

async function _createTree(parent: string, files: CommitFile[]) {
  console.log(`Creating tree with ${files.length} files`)
  const response = await repo.createTree(files, parent)
  return response.data
}

async function _createCommit(
  branch: string,
  parent: string,
  tree: string,
  message: string
) {
  console.log(`Creating commit "${message}"`)
  const response = await repo.commit(parent, tree, message)
  const { sha } = response.data

  beeline.customContext.add("commit.new_sha", sha)

  await repo.updateHead(`heads/${branch}`, sha, false)
}

interface LfsBatchResponse {
  transfer: string
  objects: LfsObjectResponse[]
}

interface LfsObjectResponse {
  oid: string
  size: string
  actions?: LfsActions
}

interface LfsActions {
  upload?: LfsUploadAction
}

interface LfsUploadAction {
  href: string
  header?: any
}

async function _initiateTransfer(files: MediaFile[]) {
  beeline.customContext.add("lfs.file_count", files.length)

  const payload = {
    operation: "upload",
    transfers: ["basic"],
    objects: files.map(({ oid, size }) => ({ oid, size })),
  }

  const response = await fetch(`${lfsUrl}/objects/batch`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      Accept: "application/vnd.git-lfs+json",
      "Content-Type": "application/vnd.git-lfs+json",
    },
  })
  const responseJson: LfsBatchResponse = await response.json()

  let existingFiles = 0
  responseJson.objects.forEach((object, i) => {
    if (!object.actions || !object.actions.upload) {
      // If there is no upload action, then we've probably already uploaded the file with this SHA before.
      existingFiles++
      return
    }

    const { href, header } = object.actions.upload
    files[i].href = href
    files[i].headers = header || {}
  })

  beeline.customContext.add("lfs.existing_files", existingFiles)
}

async function _uploadFile({ href, buffer, headers }: MediaFile) {
  if (!href) {
    return
  }

  await fetch(href, {
    method: "PUT",
    body: buffer,
    headers: { "Content-Type": "application/octet-stream", ...headers },
  })
}
