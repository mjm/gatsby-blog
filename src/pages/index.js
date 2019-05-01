import React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/Layout"
import BlogRoll, { BlogRollEntry } from "../components/BlogRoll"
import styles from "../components/Blog.module.scss"
import useSiteMetadata from "../components/SiteMetadata"

const IndexPage = ({ data }) => {
  const {
    pinnedPosts: { edges: pinned },
    allMarkdownRemark: { edges },
  } = data

  return (
    <Layout>
      <PinnedPosts posts={pinned} />
      <BlogRoll posts={edges} />
      <div className={styles.seeMore}>
        <p>
          See more posts in the <Link to="/archives/">archives</Link>.
        </p>
      </div>
    </Layout>
  )
}

const PinnedPosts = ({ posts }) => {
  const { siteUrl } = useSiteMetadata()

  if (!posts.length) {
    return null
  }

  return (
    <section className={styles.pinnedPosts}>
      {posts.map(({ node: post }) => (
        <BlogRollEntry key={post.id} siteUrl={siteUrl} post={post} pinned />
      ))}
      <hr className={styles.separator} />
    </section>
  )
}

export default IndexPage

export const pageQuery = graphql`
  query IndexQuery {
    pinnedPosts: allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___date] }
      filter: { frontmatter: { pinned: { eq: true } } }
    ) {
      edges {
        node {
          ...remarkFields
        }
      }
    }
    allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___date] }
      filter: {
        frontmatter: { templateKey: { in: ["blog-post", "microblog-post"] } }
      }
      limit: 30
    ) {
      edges {
        node {
          ...remarkFields
        }
      }
    }
  }

  fragment remarkFields on MarkdownRemark {
    excerpt(pruneLength: 400, format: HTML)
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
`
