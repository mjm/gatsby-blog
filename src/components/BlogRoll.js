import React, { useEffect,  useState } from "react";
import { Link } from "gatsby";
import { HTMLContent } from "./Content";
import useSiteMetadata from "./SiteMetadata";

const BlogRoll = ({ posts }) => {
  const { siteUrl } = useSiteMetadata();

  return (
    <div className="h-feed">
      {posts &&
        posts.map(({ node: post }) => (
          <BlogRollEntry key={post.id} post={post} siteUrl={siteUrl} />
        ))}
    </div>
  );
};

const BlogRollEntry = ({ siteUrl, post }) => {
  const entryUrl = siteUrl + post.fields.slug;

  const [mentionCount, setMentionCount] = useState(0);
  useEffect(() => {
    loadMentionCount()
  }, [entryUrl]);

  async function loadMentionCount() {
    const search = new URLSearchParams({ target: entryUrl });
    const fetchUrl = `https://webmention.io/api/count?${search.toString()}`;

    const response = await fetch(fetchUrl);
    const responseJson = await response.json();

    setMentionCount(responseJson.count);
  }

  return (
    <div>
      <article className="h-entry mt-12 mb-10">
        {post.frontmatter.title && (
          <h1 className="p-name">
            <Link
              className="no-underline text-purple-800"
              to={post.fields.slug}
            >
              {post.frontmatter.title}
            </Link>
          </h1>
        )}
        {post.frontmatter.title ? (
          <section className="e-content">{post.excerpt}</section>
        ) : (
          <HTMLContent className="e-content" content={post.html} />
        )}
        <div className="flex flex-row justify-end items-baseline mt-4 text-xs">
          {mentionCount > 0 &&
            <div className="text-purple-600 mr-2 text-sm">
              {mentionCount}
            </div>}
          <Link
            to={post.fields.slug}
            className="u-url text-purple-600 bg-purple-100 rounded-lg uppercase no-underline px-2 pb-px pt-1 border-0 border-b-2 border-solid border-transparent hover:border-purple-500"
          >
            ➔{" "}
            <time
              className="dt-published ml-1"
              dateTime={post.frontmatter.isoDate}
            >
              {post.frontmatter.date}
            </time>
          </Link>
        </div>
      </article>
      <hr className="h-1 bg-purple-100 mx-auto w-1/3 rounded-full" />
    </div>
  );
};

export default BlogRoll;
