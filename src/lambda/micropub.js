import GitHub from "github-api";
import { URLSearchParams } from "url";
import slug from "slug";
import * as rs from "randomstring";
import moment from "moment";
import * as path from "path";
import * as matter from "gray-matter";
import gatsbyConfig from "../../gatsby-config";
import fetch from "node-fetch";

const baseUrl = gatsbyConfig.siteMetadata.siteUrl;

const gh = new GitHub({
  token: process.env.GITHUB_TOKEN
});
const repo = gh.getRepo(process.env.GITHUB_USER, process.env.GITHUB_REPO);

export async function handler(event) {
  const isAuthorized = await isValidAuth(event);
  if (!isAuthorized) {
    return {
      statusCode: 403,
      body: "Your credentials are invalid."
    };
  }

  const post = readPost(event);
  const postFile = renderPost(post);

  await repo.writeFile(
    "master",
    post.path,
    postFile,
    `Added ${path.basename(post.path)}`,
    { encode: true }
  );

  return {
    statusCode: 202,
    body: "",
    headers: {
      Location: baseUrl + post.urlPath + "/"
    }
  };
}

const TOKEN_URL = "https://tokens.indieauth.com/token";

async function isValidAuth(event) {
  const token = getAuthToken(event);
  if (!token) {
    return false;
  }

  const response = await fetch(TOKEN_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    return false;
  }

  const responseJson = await response.json();

  const expectedMe = new URL(siteUrl).hostname;
  const actualMe = new URL(responseJson.me).hostname;
  if (expectedMe !== actualMe) {
    return false;
  }

  return responseJson.scope.indexOf("create") >= 0;
}

function getAuthToken(event) {
  for (const key in Object.keys(event.headers)) {
    if (key.toLowerCase() === "authorization") {
      const value = event.headers[value];
      const [type, token] = value.split(" ");
      if (type !== "Bearer") {
        throw new Error(`Invalid authorization type '${type}`);
      }

      return token;
    }
  }

  return null;
}

function readPost(event) {
  const contentType = getContentType(event);

  if (contentType === "application/x-www-form-urlencoded") {
    return readPostUrlEncoded(event.body);
  } else if (contentType === "application/json") {
    return readPostJson(event.body);
  }
}

function renderPost(post) {
  const frontmatter = {
    templateKey: post.templateKey,
    date: post.published
  };

  if (post.name) {
    frontmatter.title = post.name;
  }

  return matter.stringify("\n" + post.content, frontmatter);
}

function getContentType(event) {
  for (const key of Object.keys(event.headers)) {
    if (key.toLowerCase() === "content-type") {
      return event.headers[key].split(";")[0];
    }
  }

  return null;
}

function readPostUrlEncoded(str) {
  const params = new URLSearchParams(str);

  const post = {};
  params.forEach((value, name) => {
    if (name === "h") {
      post.type = value;
    } else if (name === "content") {
      post.content = value;
    } else if (name === "name") {
      post.title = value;
    } else if (name === "mp-slug") {
      post.slug = value;
    }
    // TODO handle arrays and things like photos
  });

  if (post.type !== "entry") {
    throw new Error("Cannot create a post that is not an entry.");
  }

  post.templateKey = post.name ? "blog-post" : "microblog-post";
  post.slug = createSlug(post);
  post.published = new Date();
  post.urlPath =
    "/" + moment.utc(post.published).format("YYYY-MM-DD-") + post.slug;
  post.path = createPath(post);

  return post;
}

slug.defaults.modes.pretty.lower = true;
const SLUG_MAX_LENGTH = 40;

function createSlug(post) {
  if (post.slug) {
    return post.slug;
  }

  if (post.name) {
    return slug(post.name);
  }

  let content;
  if (post.content) {
    content = post.content;
  } else {
    content = rs.generate(10);
  }

  let s = slug(content);
  if (s.length > SLUG_MAX_LENGTH) {
    s = s.substring(0, SLUG_MAX_LENGTH);

    const i = s.lastIndexOf("-");
    s = s.substring(0, i);
  }

  return s;
}

function createPath(post) {
  let path = "src/pages/";
  if (post.templateKey === "blog-post") {
    path += "blog";
  } else {
    path += "micro";
  }

  path += post.urlPath;
  path += ".md";

  return path;
}
