import React from "react";
import PropTypes from "prop-types";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import Content, { HTMLContent } from "../components/Content";

export const ProjectPageTemplate = ({ title, content, contentComponent }) => {
  const PageContent = contentComponent || Content;

  return (
    <article className="h-entry mt-12 mb-10">
      <h2 className="p-name">{title}</h2>
      <PageContent className="e-content" content={content} />
    </article>
  );
};

ProjectPageTemplate.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.string,
  contentComponent: PropTypes.func
};

const ProjectPage = ({ data }) => {
  const { markdownRemark: post } = data;

  return (
    <Layout>
      <ProjectPageTemplate
        contentComponent={HTMLContent}
        title={post.frontmatter.title}
        content={post.html}
      />
    </Layout>
  );
};

ProjectPage.propTypes = {
  data: PropTypes.object.isRequired
};

export default ProjectPage;

export const aboutPageQuery = graphql`
  query ProjectPage($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
      }
    }
  }
`;
