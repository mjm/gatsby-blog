import React from "react"
import { graphql } from "gatsby"
import Layout from "../../components/Layout"
import { groupBy } from "lodash"
import styles from "../../components/Books.module.scss"

const ReadingList = ({ data }) => {
  const {
    allBooksYaml: { nodes: books },
  } = data

  const booksByStatus = groupBy(books, "status")

  return (
    <Layout>
      <div className="h-feed">
        <BooksSection title="Currently Reading" books={booksByStatus.reading} />
        <BooksSection title="To Read" books={booksByStatus["to-read"]} />
        <BooksSection title="Finished" books={booksByStatus.finished} />
      </div>
    </Layout>
  )
}

const BooksSection = ({ title, books }) => {
  if (!books || books.length === 0) {
    return null
  }

  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <ul className={styles.books}>
        {books.map(book => (
          <li
            key={book.isbn || book.title}
            className={`h-entry ${styles.book}`}
          >
            <div style={{ display: "none" }} className="p-read-status">
              {book.status}
            </div>
            <a
              href={`https://isbn.nu/${book.isbn}`}
              className="p-read-of h-cite u-url"
            >
              <div className={`p-name ${styles.title}`}>{book.title}</div>
              <div className={`p-author ${styles.author}`}>{book.author}</div>
            </a>
            <div className={styles.date}>
              <time className="dt-published" dateTime={book.isoDate}>
                {book.date}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ReadingList

export const pageQuery = graphql`
  query GetReadingList {
    allBooksYaml(sort: { order: [DESC, ASC], fields: [date, title] }) {
      nodes {
        title
        author
        isbn
        date(formatString: "MMM D, Y")
        isoDate: date
        status
      }
    }
  }
`
