import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import styles from "../components/Books.module.scss"
import { orderBy } from "lodash"
import moment from "moment"
import { Helmet } from "react-helmet"

const ReadingList = ({ data }) => {
  const { reading, toRead, finished } = data

  return (
    <Layout>
      <Helmet>
        <title>Reading List</title>
      </Helmet>
      <div className="h-feed">
        <BooksSection
          title="Currently Reading"
          status="reading"
          reviews={reading.reviews}
        />
        <BooksSection
          title="To Read"
          status="to-read"
          reviews={toRead.reviews}
        />
        <BooksSection
          title="Finished"
          status="finished"
          reviews={finished.reviews}
        />
      </div>
    </Layout>
  )
}

const distantPast = new Date(1970)

const BooksSection = ({ title, status, reviews }) => {
  if (!reviews || reviews.length === 0) {
    return null
  }

  reviews = reviews.map(review => ({
    ...review,
    read_at: goodreadsDate(review.read_at),
    started_at: goodreadsDate(review.started_at),
  }))
  reviews = reviews.map(review => ({
    ...review,
    date: review.read_at || review.started_at,
  }))
  reviews = orderBy(
    reviews,
    [r => r.read_at || distantPast, "book.title_without_series"],
    ["desc", "asc"]
  )

  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <ul className={styles.books}>
        {reviews.map(review => (
          <li key={review.id} className={`h-entry ${styles.book}`}>
            <div style={{ display: "none" }} className="p-read-status">
              {status}
            </div>
            <figure>
              <a href={review.book.link}>
                <img
                  src={review.book.small_image_url}
                  alt={review.book.title_without_series}
                />
              </a>
            </figure>
            <div className={`p-read-of h-cite ${styles.info}`}>
              <a href={review.book.link} className={`p-name ${styles.title}`}>
                {review.book.title_without_series}
              </a>
              <a
                href={review.book.authors[0].link}
                className={`p-author ${styles.author}`}
              >
                {review.book.authors[0].name}
              </a>
            </div>
            <a href={review.link} className={`u-url ${styles.date}`}>
              {review.date && (
                <time
                  className="dt-published"
                  dateTime={moment(review.date).format()}
                >
                  {moment(review.date).format("MMM D, Y")}
                </time>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

const goodreadsDate = date => {
  if (!date || date === "") {
    return null
  }

  return moment(date).toDate()
}

export default ReadingList

export const pageQuery = graphql`
  query GetReadingList {
    reading: goodreadsShelf(name: { eq: "currently-reading" }) {
      ...shelfContents
    }
    toRead: goodreadsShelf(name: { eq: "to-read" }) {
      ...shelfContents
    }
    finished: goodreadsShelf(name: { eq: "read" }) {
      ...shelfContents
    }
  }

  fragment shelfContents on GoodreadsShelf {
    reviews {
      id
      rating
      started_at
      read_at
      link
      book {
        id
        title_without_series
        link
        small_image_url
        authors {
          name
          link
        }
      }
    }
  }
`
