import React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import Content, { HTMLContent } from "../components/Content";

export const MusicPageTemplate = ({
  title,
  content,
  contentComponent,
  albums
}) => {
  const PageContent = contentComponent || Content;

  return (
    <article className="h-entry mt-12 mb-10">
      <h2 className="p-name">{title}</h2>
      <div className="e-content">
        <PageContent content={content} />
        {albums.map(album => (
          <div key={`${album.name}-${album.artist}`}>
            <h3>
              <em>{album.name}</em> - {album.artist}
            </h3>
            <p>
              <a href={album.url}>
                <img
                  src={album.image}
                  alt={`${album.name} - ${album.artist}`}
                  width="300"
                  height="300"
                />
              </a>
            </p>
          </div>
        ))}
      </div>
    </article>
  );
};

const MusicPage = ({ data }) => {
  const { markdownRemark: post } = data;

  return (
    <Layout>
      <MusicPageTemplate
        contentComponent={HTMLContent}
        title={post.frontmatter.title}
        content={post.html}
        albums={post.frontmatter.albums}
      />
    </Layout>
  );
};

export default MusicPage;

export const pageQuery = graphql`
  query MusicPage($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
        albums {
          name
          artist
          url
          image
        }
      }
    }
  }
`;
