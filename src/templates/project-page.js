import React from "react";
import PropTypes from "prop-types";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import Content, { HTMLContent } from "../components/Content";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export const ProjectPageTemplate = ({
  title,
  repository,
  content,
  contentComponent
}) => {
  const PageContent = contentComponent || Content;

  return (
    <article className="h-entry mt-12 mb-10">
      <h2 className="p-name">{title}</h2>
      {repository && (
        <div className="-mt-1 mb-3 text-sm">
          <a
            href={`https://github.com/${repository}`}
            className="text-purple-800 no-underline inline-flex items-center py-1 px-2 bg-purple-100 rounded border-solid border border-purple-200"
          >
            <FontAwesomeIcon icon={faGithub} />
            <span className="ml-2 text-xs">{repository}</span>
          </a>
        </div>
      )}
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
        repository={post.frontmatter.repository}
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
        repository
      }
    }
  }
`;
