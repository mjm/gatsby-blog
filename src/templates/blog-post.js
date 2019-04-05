import React from "react";
import PropTypes from "prop-types";
import Helmet from "react-helmet";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import Content, { HTMLContent } from "../components/Content";

export const BlogPostTemplate = ({
  content,
  contentComponent,
  date,
  description,
  helmet,
  isoDate,
  title
}) => {
  const PostContent = contentComponent || Content;

  return (
    <article className="section">
      {helmet || ""}
      <h1 className="p-name">{title}</h1>
      <div className="e-content">
        <p>{description}</p>
        <PostContent content={content} />
      </div>
      <div className="text-right mt-4">
        <time
          className="dt-published text-xs py-2 px-3 text-purple-600 bg-purple-100 rounded-lg uppercase no-underline"
          dateTime={isoDate}
        >
          {date}
        </time>
      </div>
    </article>
  );
};

BlogPostTemplate.propTypes = {
  content: PropTypes.node.isRequired,
  contentComponent: PropTypes.func,
  date: PropTypes.string,
  description: PropTypes.string,
  helmet: PropTypes.object,
  isoDate: PropTypes.string,
  title: PropTypes.string
};

const BlogPost = ({ data }) => {
  const { markdownRemark: post } = data;

  return (
    <Layout>
      <BlogPostTemplate
        content={post.html}
        contentComponent={HTMLContent}
        date={post.frontmatter.date}
        description={post.frontmatter.description}
        helmet={
          <Helmet titleTemplate="%s | Blog">
            <title>{post.frontmatter.title}</title>
            <meta
              name="description"
              content={`${post.frontmatter.description}`}
            />
          </Helmet>
        }
        isoDate={post.frontmatter.isoDate}
        title={post.frontmatter.title}
      />
    </Layout>
  );
};

BlogPost.propTypes = {
  data: PropTypes.shape({
    markdownRemark: PropTypes.object
  })
};

export default BlogPost;

export const pageQuery = graphql`
  query BlogPostByID($id: String!) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      frontmatter {
        date(formatString: "MMM D, Y")
        isoDate: date(formatString: "YYYY-MM-DDTHH:mm:ssZ")
        title
        description
      }
    }
  }
`;
