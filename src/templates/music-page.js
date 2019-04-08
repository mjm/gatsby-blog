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
        <div className="flex flex-row flex-wrap">
          {albums.map(album => (
            <div
              key={`${album.name}-${album.artist}`}
              className="sm:w-1/2 p-2 text-center leading-snug"
            >
              <div>
                <a href={album.url}>
                  <img
                    src={`${album.image}?nf_resize=fit&w=300&h=300`}
                    alt={`${album.name} - ${album.artist}`}
                    className="m-0 shadow-lg"
                  />
                </a>
              </div>
              <div>
                <em>{album.name}</em>
              </div>
              <div className="text-sm uppercase">{album.artist}</div>
            </div>
          ))}
        </div>
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
