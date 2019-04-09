---
templateKey: project-page
title: Courier
repository: mjm/courier
description: >
  A service for crossposting from microblogs to Twitter.
  Responsible for sending the posts on this site to my Twitter account.
uses:
- Ruby
- Rails
- Elm
- PostgreSQL
- Heroku
---

Crossposting from a blog to Twitter is not a novel concept.
I'm certain there are many things like it, but this one is mine.

When I started this site, I tried many different plugins and services to automate crossposting.
Most of them assumed you have a normal blog where posts have titles, but you may have noticed that there are very few of those on here.
Most of what I write are tweet-style posts, which ideally would be posted to Twitter mostly as-is, as though I had written them for Twitter first.

The closest thing I found to doing what I want is the \$2/month crossposting service from [Micro.blog](https://micro.blog).
Given that it's designed for microblogs, it makes sense that it does a much better job with titleless tweet-like posts.
But I guess I'm particular, and I still found situations where I didn't like how it translated something.

I wanted something that had opinions on how tweets should be formatted and could take what I wrote on here and make it make sense for Twitter.
That's what Courier is.
I think it does a good enough job that most of my followers don't even realize that I post here first.
