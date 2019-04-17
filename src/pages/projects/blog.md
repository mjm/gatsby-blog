---
templateKey: project-page
title: mattmoriarity.com
repository: mjm/gatsby-blog
description: >
  This website, a sweet combination of Gatsby and Netlify functions.
  The primary destination of my silly thoughts that would become tweets.
uses:
  - JavaScript
  - Gatsby
  - React
  - Netlify
---

This site is one of my projects.
I started it at the beginning of 2018 when I started [microblogging](https://micro.blog).
The idea is that instead of posting to Twitter directly, I write things here, and have some software [crosspost to Twitter](/projects/courier/).

The site has gone through several generations of implementations, though the content has been carried forward as I transitioned between them.

1. Wordpress + several microblogging-related plugins
2. A [completely homegrown static site generator running on AWS Lambda](/2018/12/microblogging-with-serverless/)
3. [Gatsby](https://www.gatsbyjs.org/) + some adaptations for microblogging

The current generation is largely a pretty typical Gatsby blog, but there are some things I've added to mine that I think are interesting.

### Micropub support

Most of my posts to this site are tweet-style posts, which are one-off thoughts that I don't spend a lot of time constructing.
I want to be able to easily fire these off, similar to how I might write a post on Twitter if I still did that.
To do that, I've been using the super useful app [Drafts][] on my iPhone to write up these posts.
I have an action that uses the [Micropub][] standard to make the post.
I've been doing this since Generation 2 of the site, so when I converted to Gatsby, I wanted to reimplement this feature.

Despite this being a static site, this was pretty straightforward to support.
This site is hosted on [Netlify][], which supports [Lambda functions][lambda].
They're a pretty thin wrapper around AWS Lambda functions, but they get automatically deployed as part of your site build, and you don't have to mess around with creating any AWS resources.
They're perfect for sprinkling a little bit of dynamic server-side action on your site.

After checking authentication with [IndieAuth][], the Micropub function parses out the fields for the post.
It then creates a slug, and constructs the Markdown file that will hold the post in the repo.
It uses the GitHub REST API to write the new file into the repository.
The commit triggers a new build in Netlify, and a couple minutes later the post is live on the site.
It's not quite as speedy as it used to be, but I can accept the delay.

[drafts]: https://getdrafts.com/
[micropub]: https://www.w3.org/TR/micropub/
[netlify]: https://www.netlify.com/
[lambda]: https://www.netlify.com/docs/functions/
[indieauth]: https://indieauth.com/

### Webmentions

This site doesn't use a typical commenting system.
Instead, I only support [webmentions][], an open standard where someone can reply to (or repost, or like, or bookmark) a post on a site by making one on their own site.
As a bit of a shortcut, [Micro.blog][microdotblog] will send webmentions for replies within its system.
This makes it trivial to do Twitter-like replying in an IndieWeb-friendly way.

I like displaying these mentions on my site.
In Generation 2, I implemented support for receiving webmentions myself.
For Generation 3, I decided to use [Webmention.io][webmentionio] for this and simplify how much I was responsible for handling.

The static rendering of the site doesn't include any information about webmentions, since that data would get stale very quickly.
Instead, the React components that render the posts have dynamic effects that only occur when they run in the browser.
They get the latest mention counts or mention data from Webmention.io and update the page client-side.
It's not too different to how Disqus embeds comments in a static page, although it's much more lightweight.
Gatsby makes this incredibly easy to do: I wrote this exactly how I would in a traditional React webapp, and it worked exactly how you would expect.

[webmentions]: https://www.w3.org/TR/webmention/
[microdotblog]: https://micro.blog/
[webmentionio]: https://webmention.io/
