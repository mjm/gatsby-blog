import React from "react"
import Layout from "../../components/Layout"
import { graphql, Link } from "gatsby"
import styles from "../../components/Project.module.scss"

const ProjectsPage = ({ data }) => {
  const {
    allMarkdownRemark: { nodes: projects },
  } = data

  return (
    <Layout>
      <article>
        <h2>Software Projects</h2>
        {projects.map(p => (
          <ProjectCell project={p} key={p.fields.slug} />
        ))}
      </article>
    </Layout>
  )
}

const ProjectCell = ({ project }) => {
  return (
    <div className={styles.cell}>
      <Link to={project.fields.slug}>
        <h3>{project.frontmatter.title}</h3>
        <p>{project.frontmatter.description}</p>
      </Link>
    </div>
  )
}

export default ProjectsPage

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
`
