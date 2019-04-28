const beeline = require("./honeycomb")
const fetch = require("node-fetch")
const GitHub = require("github-api")

const gh = new GitHub({ token: process.env.GITHUB_TOKEN })
const lfsUrl = `https://access-token:${
  process.env.NETLIFY_TOKEN
}@www.mattmoriarity.com/.netlify/large-media`

const repo = gh.getRepo(process.env.GITHUB_USER, process.env.GITHUB_REPO)

exports.commit = async function commit({ branch, message, files }) {
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

exports.upload = async function upload(files) {
  if (!files.length) {
    return
  }

  await _initiateTransfer(files)
  for (const file of files) {
    await _uploadFile(file)
  }
}

async function _getBranch(branch) {
  const response = await repo.getBranch(branch)
  return response.data
}

async function _createTree(parent, files) {
  console.log(`Creating tree with ${files.length} files`)
  const response = await repo.createTree(files, parent)
  return response.data
}

async function _createCommit(branch, parent, tree, message) {
  console.log(`Creating commit "${message}"`)
  const response = await repo.commit(parent, tree, message)
  const { sha } = response.data

  beeline.customContext.add("commit.new_sha", sha)

  await repo.updateHead(`heads/${branch}`, sha, false)
}

async function _initiateTransfer(files) {
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
  const responseJson = await response.json()

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

async function _uploadFile({ href, buffer, headers }) {
  if (!href) {
    return
  }

  await fetch(href, {
    method: "PUT",
    body: buffer,
    headers: { "Content-Type": "application/octet-stream", ...headers },
  })
}
