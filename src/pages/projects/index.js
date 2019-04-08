import React from "react";
import Layout from "../../components/Layout";
import { graphql, Link } from "gatsby";

const ProjectsPage = ({ data }) => {
  const {
    allMarkdownRemark: { nodes: projects }
  } = data;

  return (
    <Layout>
      <article className="mt-12 mb-10">
        <h2>Projects</h2>
        {projects.map(p => (
          <ProjectCell project={p} key={p.fields.slug} />
        ))}
      </article>
    </Layout>
  );
};

const ProjectCell = ({ project }) => {
  return (
    <div className="border-solid border border-purple-300 rounded-lg bg-purple-100 mb-4">
      <Link className="block p-3 no-underline" to={project.fields.slug}>
        <h3 className="text-sm mb-2 text-purple-800">
          {project.frontmatter.title}
        </h3>
        <p className="text-sm mb-0 text-indigo-900">
          {project.frontmatter.description}
        </p>
      </Link>
    </div>
  );
};

export default ProjectsPage;

export const pageQuery = graphql`
  query ProjectPages {
    allMarkdownRemark(
      filter: { frontmatter: { templateKey: { eq: "project-page" } } }
      sort: { fields: [frontmatter___title], order: [ASC] }
    ) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          description
        }
      }
    }
  }
`;
