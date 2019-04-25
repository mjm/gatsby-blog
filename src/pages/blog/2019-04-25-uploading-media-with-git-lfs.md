---
templateKey: blog-post
date: 2019-04-25T18:00:00Z
title: Uploading Media with Git LFS
---

When I started using [Netlify][] and [Gatsby][] for this site, I had to decide where to store media content that goes along with the site (mostly photos and other images).
I could have just stored it in Git with the rest of the content and simplified my life a bit, but then I would be worrying about bloating up my Git repository with binary files. This can be an issue as a repository grows, since cloning a Git repository pulls down all of the history, even for files that were deleted in the current branch.
So instead, I started storing media content in [Git LFS][lfs] using [Netlify Large Media][largemedia].

[netlify]: https://www.netlify.com/
[gatsby]: https://www.gatsbyjs.org/
[lfs]: https://git-lfs.github.com/
[largemedia]: https://www.netlify.com/docs/large-media/

<!--more-->

One of the ways I post content to this site is with [OwnYourGram][], which pulls the photos I post on [Instagram][] and cross-posts them to my own site as well.
OwnYourGram uses [Micropub][] to post entries, which is great: I've already implemented a Micropub endpoint for this site so I can post small text posts from [Drafts][].
I just needed to update my Micropub implementation to be able to handle file uploads, which I had already supported in the previous version of my site.

Not so fast, though: the old version uploaded files straight to S3, which was also hosting the site.
Not too many moving parts there.
The new site is keeping images in Netlify Large Media, so now I needed to figure out how to programmatically add files to my Git repo that were actually stored in Netlify's Git LFS storage.
It seemed like it would be a huge hassle, but it actually wasn't as difficult as I expected.
Now I'm going to tell you how you can do it!

My code examples will be in JavaScript using the [github-api](https://www.npmjs.com/package/github-api) NPM package to interact with the GitHub API.
This package is a pretty thin wrapper around GitHub's V3 REST API, though, so the examples should translate to other environments.
I also use [node-fetch](https://www.npmjs.com/package/node-fetch) for making HTTP requests to other endpoints, which you can substitute for your preferred way of making those requests.

[ownyourgram]: https://ownyourgram.com/
[instagram]: https://www.instagram.com/
[micropub]: https://www.w3.org/TR/micropub/
[drafts]: https://getdrafts.com/

## Storing files with Git LFS

The GitHub API makes it pretty easy to write a single file to a repository with a commit:

```js
await repo.writeFile(
  "master",
  "src/pages/my-page.md",
  pageContents,
  "Added my-page.md"
)
```

The contents of the page are stored as a blob in the repository, and it can be referenced in the tree from there.
But Git LFS's whole purpose is to not store large files as blobs in the repository!
Instead, Git LFS puts a "pointer file" in place of the actual file, and this pointer file references the actual file that is stored elsewhere.

Storing a file in Git LFS will actually be a three-step process:

1. Tell the Git LFS server about the file(s) we want to upload
2. Upload the contents of each file
3. Write pointer file(s) into the Git repository

I'll break down each of these steps one-by-one, so that by the end you'll understand how to go from having a file you want to store to having it committed to your repo with Git LFS.

### Prerequisites

Your Git LFS server can be independent from your Git repository.
In my case, GitHub is hosting my Git repository, but Netlify is hosting my large files with LFS.
When you setup LFS for your repo, it should create a `.lfsconfig` file in the root of your repository which will tell the Git LFS client which server to use.

You can add an extra step to your implementation of these uploads that involves reading this file to determine the right server.
But for my purposes, I hardcoded the server since I always want to upload files to the same repository.
It also simplifies authentication by not having to worry about the different strategies that different servers use.

```js
// this is how Netlify Large Media handles auth
const username = "access-token"
const password = process.env.NETLIFY_TOKEN

// replace with your LFS URL from .lfsconfig
const lfsUrl = `https://${username}:${password}@www.mattmoriarity.com/.netlify/large-media`
```

I'll reference this URL later when communicating with the LFS server.

### Initiating the transfer

The first thing we need to do to store a file in Git LFS is to start an upload operation.
This won't involve transferring any of the actual bytes of the file yet: instead, it's letting the Git LFS server know what files we want to store.
The server will then tell us how we can actually upload the content.

Before we start, we need to know the OID and size of the file we're going to upload.
Assuming we have the file contents in an in-memory Buffer, we could do that like this:

```js
const crypto = require("crypto")

const hash = crypto.createHash("sha256")
hash.update(buffer)

const oid = hash.digest("hex")
const size = Buffer.byteLength(buffer)
```

The OID is a hash of the contents of the file.
Both Git and Git LFS are both examples of [content-addressable storage][cas] systems, where we identify a piece of data by a hash of its contents.

[cas]: https://en.wikipedia.org/wiki/Content-addressable_storage

Now we can initiate the transfer by making a `POST` request to the `/objects/batch` endpoint on the Git LFS server, including a payload describing the operation we want to perform:

```js
const payload = {
  operation: "upload",
  transfers: ["basic"],
  objects: [{ oid: oid, size: size }],
}

const response = await fetch(`${lfsUrl}/objects/batch`, {
  method: "POST",
  body: JSON.stringify(payload),
  headers: {
    Accept: "applications/vnd.git-lfs+json",
    "Content-Type": "applications/vnd.git-lfs+json",
  },
})
const responseJson = await response.json()
```

This request is basically us saying to the server: "I'm about to upload some files. How would you like me to do that?"
We're only providing a single object, but if we have several files to upload, we could provide multiple in one batch.
We'll receive a JSON payload that looks very similar to the one we sent, but with some useful new information from the server:

```json
{
  "transfer": "basic",
  "objects": [
    {
      "oid": "3ff49a2ca5eb17ed33f00dc470ace5d73515718cc90dd60797b608aae03efac7",
      "size": 118404,
      "authenticated": false,
      "actions": {
        "upload": {
          "href": "https://example.com/upload/to/somewhere",
          "header": {
            ...
          },
          "expires_in": 86400,
        }
      }
    }
  ]
}
```

Much of the information is exactly what we provided to in the request body, but now the object includes an `actions` object.
The `upload` object within provides all of the information we will need to actually upload the file.
We'll use that information in the next step.

It's possible for an object to be missing the `actions` key entirely:

```json
{
  "transfer": "basic",
  "objects": [
    {
      "oid": "3ff49a2ca5eb17ed33f00dc470ace5d73515718cc90dd60797b608aae03efac7",
      "size": 118404
    }
  ]
}
```

This is good!
It means that the LFS server already knows about this file, and doesn't need us to upload it again.
In this case, we can harmlessly skip the next step and go straight to writing the pointer file.

### Uploading the file

If we do get an `upload` action back from the server, then we need to use it to actually upload the file.
We'll use a PUT request for this, providing the raw contents of the file as the request body.
We'll also be sure to include any headers that the server told us should be included.

```js
for (const object of responseJson.objects) {
  if (!object.action || !object.actions.upload) {
    // ignore already uploaded file
    continue
  }

  let { href, header } = object.action.upload
  header = header || {}

  await fetch(href, {
    method: "PUT",
    body: buffer,
    headers: {
      "Content-Type": "application/octet-stream",
      ...header,
    },
  })
}
```

At this point, the LFS server has our file and is tracking it, so we just need to update our Git repository to refer to it.

### Writing the pointer file to the repository

A pointer file is a small text file we store in our Git repository that includes the OID and size of the file it's meant to take the place of.
In this example, it might look something like this:

```text
version https://git-lfs.github.com/spec/v1
oid sha256:3ff49a2ca5eb17ed33f00dc470ace5d73515718cc90dd60797b608aae03efac7
size 118404
```

It's important that there is also a trailing newline character at the end of the file.
If you don't include it, then when you check out your branch, Git will constantly think the files are modified.
It's very frustrating to deal with: please don't make my mistake!

We can generate the pointer file in our code and write it to the Git repo in the location where we would otherwise store the file directly if we weren't using LFS:

```js
const pointerFile = `version https://git-lfs.github.com/spec/v1
oid sha256:${oid}
size ${size}
`

await repo.writeFile(
  "master",
  "static/img/my-new-image.jpg",
  pointerFile,
  "Added my-new-image.jpg"
)
```

That's it! If we pulled this branch onto our own machine after running this code, we would have our file at `static/img/my-new-image.jpg`, but without it actually being stored directly in our Git repository.

---

I hope that this shatters some of the mystery around Git LFS and how it works.
It's not much more difficult than working with just Git, and conceptually they are both very similar ways of storing data.
