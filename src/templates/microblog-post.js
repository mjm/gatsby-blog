import React from "react";
import PropTypes from "prop-types";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import Content, { HTMLContent } from "../components/Content";

export const MicroblogPostTemplate = ({
  content,
  contentComponent,
  date,
  isoDate,
  photos
}) => {
  photos = photos || [];
  const PostContent = contentComponent || Content;

  return (
    <article className="h-entry mt-12 mb-10">
      <PostContent className="p-name e-content" content={content} />
      {photos.map(photo => (
        <figure key={photo}>
          <img src={photo} className="u-photo" />
        </figure>
      ))}
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

MicroblogPostTemplate.propTypes = {
  content: PropTypes.node.isRequired,
  contentComponent: PropTypes.func,
  date: PropTypes.string,
  isoDate: PropTypes.string,
  photos: PropTypes.array
};

const MicroblogPost = ({ data }) => {
  const { markdownRemark: post } = data;

  return (
    <Layout>
      <MicroblogPostTemplate
        content={post.html}
        contentComponent={HTMLContent}
        date={post.frontmatter.date}
        isoDate={post.frontmatter.isoDate}
        photos={post.frontmatter.photos}
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
        date(formatString: "MMM D, Y")
        isoDate: date(formatString: "YYYY-MM-DDTHH:mm:ssZ")
        photos
      }
    }
  }
`;
