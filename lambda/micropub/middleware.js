const beeline = require("honeycomb-beeline")()
const Post = require("./post")

exports.form = async function formMiddleware(req) {
  if (!req.is(["urlencoded", "multipart"])) {
    return
  }

  beeline.customContext.add("micropub.request_type", "form")

  const { body, files } = req

  const post = new Post()
  post.type = body.h
  post.title = body.name
  post.content = body.content
  post.slug = body["mp-slug"]
  post.published = body.published

  if (body.photo) {
    post.photos = [].concat(body.photo)
  }
  if (files) {
    post.photoFiles = files.photo || files["photo[]"]
  }

  req.post = post
}

exports.json = async function jsonMiddleware(req) {
  if (!req.is("json")) {
    return
  }

  beeline.customContext.add("micropub.request_type", "json")

  const {
    body: { type, properties: props },
  } = req

  const post = new Post()
  post.type = type.replace(/^h-/, "")
  post.title = single(props.name)
  post.content = single(props.content)
  post.slug = single(props["mp-slug"])
  post.published = single(props.published)
  post.photos = props.photo

  req.post = post
}

function single(arr) {
  return arr && arr[0]
}
