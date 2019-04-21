import React from "react"
import { Link } from "gatsby"
import styles from "./Navbar.module.scss"

const Navbar = () => {
  return (
    <nav
      className={styles.navbar}
      role="navigation"
      aria-label="main-navigation"
    >
      <ul>
        <li>
          <Link to="/" className={styles.link} activeClassName={styles.active}>
            Blog
          </Link>
        </li>
        <li>
          <Link
            to="/about/"
            className={styles.link}
            activeClassName={styles.active}
          >
            About
          </Link>
        </li>
        <li>
          <Link
            to="/projects/"
            className={styles.link}
            activeClassName={styles.active}
            partiallyActive
          >
            Projects
          </Link>
        </li>
        <li>
          <Link
            to="/music/"
            className={styles.link}
            activeClassName={styles.active}
          >
            Music
          </Link>
        </li>
        <li>
          <Link
            to="/books/"
            className={styles.link}
            activeClassName={styles.active}
          >
            Reading
          </Link>
        </li>
        <li>
          <Link
            to="/talks/"
            className={styles.link}
            activeClassName={styles.active}
          >
            Talks
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar
