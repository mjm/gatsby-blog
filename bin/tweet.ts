#!/usr/bin/env npx ts-node

/*

This script automates creating and committing a tweet-style post.

*/

process.env.SUPPRESS_HONEYCOMB_LOG = "true"

import { Post } from "../lib/post"
import * as os from "os"
import * as path from "path"
import * as fs from "fs"
import { spawnSync } from "child_process"
import matter from "gray-matter"

const repoRoot = path.normalize(path.join(__dirname, ".."))

function go() {
  const post = Post.build({
    type: "entry",
  }).generate()

  const rawData = post.render()

  const tmpPath = path.join(os.tmpdir(), path.basename(post.path))
  fs.writeFileSync(tmpPath, rawData)

  console.log(`Wrote empty draft to ${tmpPath}`)

  // The 6 here is the line the cursor should be on, where we want to start typing.
  spawnSync("code", ["-n", "-w", "-g", `${tmpPath}:6`])

  const newData = fs.readFileSync(tmpPath, { encoding: "utf-8" })
  const { content } = matter(newData)

  if (!content.trim()) {
    console.error("The new post doesn't have any content. Canceling.")
    process.exit(1)
  }

  const newPost = Post.build({
    type: "entry",
    content: content.replace(/^\n/, ""),
  }).generate()
  const newPath = path.join(repoRoot, newPost.path)
  console.log(`Saving new post to ${newPath}`)
  fs.renameSync(tmpPath, newPath)

  console.log("Committing new post to Git")
  spawnSync("git", ["add", newPath], { cwd: repoRoot })
  spawnSync(
    "git",
    ["commit", "-m", `Added ${path.basename(newPath)}`, newPath],
    { cwd: repoRoot }
  )

  console.log("Done!")
}

go()
