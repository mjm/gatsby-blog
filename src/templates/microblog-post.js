import React from "react";
import PropTypes from "prop-types";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import Content, { HTMLContent } from "../components/Content";

export const MicroblogPostTemplate = ({ content, contentComponent }) => {
  const PostContent = contentComponent || Content;

  return (
    <section className="section">
      <div className="container content">
        <div className="columns">
          <div className="column is-10 is-offset-1">
            <PostContent content={content} />
          </div>
        </div>
      </div>
    </section>
  );
};

MicroblogPostTemplate.propTypes = {
  content: PropTypes.node.isRequired,
  contentComponent: PropTypes.func
};

const MicroblogPost = ({ data }) => {
  const { markdownRemark: post } = data;

  return (
    <Layout>
      <MicroblogPostTemplate
        content={post.html}
        contentComponent={HTMLContent}
      />
    </Layout>
  );
};

MicroblogPost.propTypes = {
  data: PropTypes.shape({
    markdownRemark: PropTypes.object
  })
};

export default MicroblogPost;

export const pageQuery = graphql`
  query MicroblogPostByID($id: String!) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      frontmatter {
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`;
