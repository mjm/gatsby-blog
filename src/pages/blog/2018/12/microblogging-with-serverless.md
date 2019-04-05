---
templateKey: blog-post
date: '2018-12-22T03:48:46.205Z'
title: Microblogging with Serverless
---

I've been microblogging here on [mattmoriarity.com](https://mattmoriarity.com) for the last year.
I like posting short little thoughts (I don't often have the attention span or the time for long posts like this one), and I've been using Twitter for that for over a decade now.
But these days, I prefer to post everything first to my own site and then [syndicate it to other places](https://indieweb.org/POSSE) like Twitter.

When I set up this site, I used WordPress.
It was, and still is, the best free off-the-shelf tool for the job, with a community of plugins and people doing [IndieWeb](https://indieweb.org/) and microblogging things.
I've used it successfully for this purpose for a year now, but recently I found myself wanting something different.
I wanted a little more control over my microblogging workflow.

At the same time, I've also recently become interested in [AWS Lambda](https://aws.amazon.com/lambda/) and other AWS offerings.
AWS has a really generous [free tier](https://aws.amazon.com/free/).
After making a small project with Lambda and being impressed with how easy it was to build, I started to wonder if I could build my own blogging engine with Lambda.

As a matter of fact, I could and I did! This site is now running on my new AWS-powered [blogging engine](https://github.com/mjm/serverless-blog).
I figure that it may be interesting to others how I went about assembling this all together, so here goes.

### S3 for static site hosting

Initially, my plan was to see how well I could render a website dynamically using Lambda functions.
This would have been your typical ordinary dynamic web site, just running in a serverless environment.

The plan changed when I realized that S3 can be used to serve a static website.
There are two pieces that come together to make this a really good solution:

- If you name your S3 bucket by a domain name, you can use a CNAME DNS record to point the domain at that bucket's contents.
- Beyond just serving files, S3 has explicit support for serving websites. You can configure your bucket to serve `index.html` files when requesting a directory and serve a particular page for errors.

Beyond that, S3 is really cheap!
It's not actually part of the AWS Free Tier, but that's okay.
The normal costs of operating a website on S3 are minimal.
It costs less than $0.01 to serve 10,000 GET requests, so even for a high traffic site, you won't be paying much.

One thing you don't get from S3 is HTTPS.
S3 buckets serving websites only serve content over HTTP, but if you're interested in serving your site over HTTPS, you have some options.

One is AWS CloudFront, which puts your S3 bucket on a CDN protected by an AWS-issued certificate.
You lose some of the special website behavior from S3 like serving `index.html`, and propagating changes to the CDN can be slow, so I don't like this option too much.
I ended up using CloudFlare, which will run your site through its caching proxies and serve it over HTTPS for you.

In addition to serving the generated web pages for the site, I also use S3 to store any uploaded photos, as well as the templates that are used to generate the pages.

### DynamoDB for document storage

AWS has many different database offerings, but [DynamoDB](https://aws.amazon.com/dynamodb/) is the only one that is always part of the AWS Free Tier.
Even if there were other options, though, DynamoDB is a pretty compelling choice for a lot of applications, including this one.
DynamoDB is a NoSQL database with design goals for distributed scaling that _greatly_ exceed what I need for storing the contents of a blog or two.
It does, however, let me store a bunch of documents that have somewhat unpredictable structures.

I'm using DynamoDB to store a few different kinds of data:

- Some configuration data for the site: title, author, ping URLs, etc. This is all in one `config` document.
- Every static page on the site as its own document.
- Every post published to the site as its own document. Rather than choose my own schema for posts, I've decided to embrace [microformats](http://microformats.org/wiki/Main_Page) for how I store my posts. I use property names that match the ones specified for microformats, and I support storing any unknown properties so I can decide what to do with them later.

The free tier of DynamoDB is limited in two different ways: storage capacity and throughput.
You get 25GB of storage for free, which is _way_ more than I need, especially since media content is all stored directly in S3.

Throughput is a more scarce resource.
AWS measures throughput based on how much data you have to scan through when querying.
Using the free tier effectively requires giving some thought about how to query for exactly what you need, and if you're used to RDBMS's like I am, you might be surprised by the limitations of this.
I'm hoping to write another post talking more about the specifics of how I've approached this.
I think I've ended up with a pretty good solution that avoids querying for more data than is needed.

### Lambda and API Gateway

I use Lambda functions for two main groups of dynamic behavior:

- Adding or updating the content in the database using an HTTP API based on the [Micropub][] specification
- Generating the static content in response to database changes and uploading it to S3

[micropub]: https://www.w3.org/TR/micropub/

I really love using Lambda for this kind of work.
Its model makes it really easy to focus in on the unique work that your code needs to do.
It's been very pleasant to not give much thought to processes or HTTP servers or how to scale them.

The pricing model is also very well suited to this use case.
Lambda functions are paid per request: if you're not responding to a request, you're not paying.
Since I'm not blogging constantly, and because the site is statically generated, most of the time I'm not actually making requests.
Lambda is very efficient for this kind of workload.
The free tier gives you a whopping 1,000,000 requests for free, which is more than enough for how often I'll be querying my API.

Lambda functions alone do not an HTTP API make.
Something has to call those functions in response to HTTP requests, and that's what API Gateway is for.
At its most basic, API Gateway lets you define which HTTP requests will be handled by which Lambda functions.
It also provides a proxy that constructs an event payload for your Lambda function that includes useful information from the HTTP request in a structured form.

I also use another feature of API Gateway: custom authorizers.
This lets me define a particular lambda function for validating authorization tokens for my API.
I use this to both ensure a valid token is provided and provide information to my other functions about who the token belongs to and what accesses it grants.
Once I have this authorizer, it's easy to attach it to the different API endpoints that need to be protected.

---

I'm very happy with how this engine has turned out, and I'm glad that I chose to run it on AWS.
It's proving to be a very fun project, and one of the more cost-effective ways that I can blog the way I want to.

