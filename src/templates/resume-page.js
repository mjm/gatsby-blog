import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import Content, { HTMLContent } from "../components/Content"
import styles from "../components/Resume.module.scss"
import { Helmet } from "react-helmet"

export const ResumePageTemplate = ({
  title,
  content,
  contentComponent,
  experience,
  education,
  skills,
}) => {
  const PageContent = contentComponent || Content

  return (
    <article className="h-entry">
      <h2 className="p-name">{title}</h2>
      <PageContent className="e-content" content={content} />
      <Experience experience={experience} />
      <Education education={education} />
      <Skills skills={skills} />
    </article>
  )
}

const Experience = ({ experience }) => {
  return (
    <section className={styles.section}>
      <h3>Experience</h3>
      {experience.map((exp, i) => (
        <div key={i} className={styles.experience}>
          <div className={styles.header}>
            <h4 className={styles.company}>{exp.company}</h4>
            <div className={styles.dates}>
              {exp.startDate} - {exp.endDate || "Now"}
            </div>
          </div>
          <p>{exp.description}</p>
        </div>
      ))}
    </section>
  )
}

const Education = ({ education }) => {
  const { school, location, degree, year } = education
  return (
    <section className={`${styles.section} ${styles.education}`}>
      <h3>Education</h3>
      <h4>
        {school} – <em>{location}</em>
      </h4>
      <p>
        {degree}, {year}
      </p>
    </section>
  )
}

const Skills = ({ skills }) => {
  const { languages, tools } = skills

  return (
    <section>
      <h3>Skills</h3>
      <div className={styles.skillLists}>
        <SkillList label="Languages" items={languages} />
        <SkillList label="Tools" items={tools} />
      </div>
    </section>
  )
}

const SkillList = ({ label, items }) => {
  return (
    <div className={styles.skillList}>
      <h4>{label}</h4>
      <div className={styles.skills}>
        {items.map(i => (
          <div key={i} className={styles.skill}>
            {i}
          </div>
        ))}
      </div>
    </div>
  )
}

const ResumePage = ({ data }) => {
  const { markdownRemark: post } = data

  return (
    <Layout>
      <Helmet>
        <title>Resume</title>
      </Helmet>
      <ResumePageTemplate
        contentComponent={HTMLContent}
        title={post.frontmatter.title}
        content={post.html}
        experience={post.frontmatter.experience}
        education={post.frontmatter.education}
        skills={post.frontmatter.skills}
      />
    </Layout>
  )
}

export default ResumePage

export const pageQuery = graphql`
  query ResumePage($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
        experience {
          company
          description
          startDate
          endDate
        }
        education {
          school
          location
          degree
          year
        }
        skills {
          languages
          tools
        }
      }
    }
  }
`
