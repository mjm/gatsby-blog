import express from "express"
import "multer"
import beeline from "./honeycomb"
import { Post, PostBuilder } from "./post"

declare global {
  namespace Express {
    interface Request {
      post: Post
    }
  }
}

export async function form(
  req: express.Request,
  res: express.Response
): Promise<"next" | void> {
  // @ts-ignore
  if (!req.is(["urlencoded", "multipart"])) {
    return "next"
  }

  beeline.customContext.add("micropub.request_type", "form")

  const body = req.body
  const files = req.files as { [fieldname: string]: Express.Multer.File[] }

  const post = Post.build()
  post.type = body.h
  post.title = body.name
  post.content = body.content
  post.slug = body["mp-slug"]
  post.published = body.published

  if (body.photo) {
    post.photos = [].concat(body.photo)
  }
  if (files) {
    post.addMedia("photos", files.photo || files["photo[]"])
  }

  return await generatePost(post, req, res)
}

export async function json(
  req: express.Request,
  res: express.Response
): Promise<"next" | void> {
  if (!req.is("json")) {
    return "next"
  }

  beeline.customContext.add("micropub.request_type", "json")

  const { body } = req
  if (body.action === "update") {
    return await handleJsonUpdate(body, req, res)
  } else if (body.type) {
    return await handleJsonCreate(body, req, res)
  }
}

async function handleJsonCreate(
  body: any,
  req: express.Request,
  res: express.Response
): Promise<"next" | void> {
  const { type, properties: props } = body

  const post = Post.build()
  post.type = type[0].replace(/^h-/, "")
  post.title = single(props.name)
  post.content = single(props.content)
  post.slug = single(props["mp-slug"])
  post.published = single(props.published)
  post.photos = props.photo

  return await generatePost(post, req, res)
}

async function handleJsonUpdate(
  body: any,
  req: express.Request,
  res: express.Response
): Promise<"next" | void> {}

async function generatePost(
  post: PostBuilder,
  req: express.Request,
  res: express.Response
): Promise<"next" | void> {
  req.post = post.generate()
  return "next"
}

function single<T>(arr: T[]): T | undefined {
  return arr && arr[0]
}
