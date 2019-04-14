import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import Content, { HTMLContent } from "../components/Content"

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
    <section className="mb-6">
      <h3>Experience</h3>
      {experience.map((exp, i) => (
        <div
          key={i}
          className="bg-purple-100 border-solid border-0 border-t-4 border-purple-300 mb-4 p-3 shadow-md"
        >
          <div className="flex items-baseline">
            <h4 class="flex-grow mb-2">{exp.company}</h4>
            <div class="text-xs italic">
              {exp.startDate} - {exp.endDate || "Now"}
            </div>
          </div>
          <p className="text-sm mb-0">{exp.description}</p>
        </div>
      ))}
    </section>
  )
}

const Education = ({ education }) => {
  const { school, location, degree, year } = education
  return (
    <section className="mb-6">
      <h3>Education</h3>
      <h4 className="mb-1">
        {school} – <em>{location}</em>
      </h4>
      <p className="text-sm">
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
      <div className="flex flex-wrap">
        <SkillList label="Languages" items={languages} />
        <SkillList label="Tools" items={tools} />
      </div>
    </section>
  )
}

const SkillList = ({ label, items }) => {
  return (
    <div className="w-full sm:w-1/2">
      <h4 className="mr-2 mb-3">{label}</h4>
      <div className="flex flex-row flex-wrap items-center mt-2 mb-2">
        {items.map(i => (
          <div
            key={i}
            className="text-sm bg-purple-100 rounded px-2 py-1 mr-2 mb-2 shadow"
          >
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
