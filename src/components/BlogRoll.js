import React from "react";
import PropTypes from "prop-types";
import { Link, graphql, StaticQuery } from "gatsby";
import { HTMLContent } from "./Content";

class BlogRoll extends React.Component {
  render() {
    const { data } = this.props;
    const { edges: posts } = data.allMarkdownRemark;

    return (
      <div className="h-feed">
        {posts &&
          posts.map(({ node: post }) => (
            <div key={post.id}>
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
          ))}
      </div>
    );
  }
}

BlogRoll.propTypes = {
  data: PropTypes.shape({
    allMarkdownRemark: PropTypes.shape({
      edges: PropTypes.array
    })
  })
};

export default () => (
  <StaticQuery
    query={graphql`
      query BlogRollQuery {
        allMarkdownRemark(
          sort: { order: DESC, fields: [frontmatter___date] }
          filter: {
            frontmatter: {
              templateKey: { in: ["blog-post", "microblog-post"] }
            }
          }
          limit: 30
        ) {
          edges {
            node {
              excerpt(pruneLength: 400)
              id
              html
              fields {
                slug
              }
              frontmatter {
                title
                templateKey
                date(formatString: "MMM D, Y")
                isoDate: date(formatString: "YYYY-MM-DDTHH:mm:ssZ")
              }
            }
          }
        }
      }
    `}
    render={(data, count) => <BlogRoll data={data} count={count} />}
  />
);
