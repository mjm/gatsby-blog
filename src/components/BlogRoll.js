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
            <>
              <article className="h-entry mt-12 mb-10" key={post.id}>
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
              </article>
              <hr className="h-1 bg-purple-100 mx-auto w-1/3 rounded-full" />
            </>
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
                date(formatString: "MMMM DD, YYYY")
              }
            }
          }
        }
      }
    `}
    render={(data, count) => <BlogRoll data={data} count={count} />}
  />
);
