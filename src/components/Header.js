import React from "react"
import { Link } from "gatsby"

import styles from "./Header.module.scss"

const Header = () => {
  return (
    <header className={`h-card ${styles.header}`}>
      <Link to="/" title="Home" className="u-url">
        <h1>
          <img
            src="https://gravatar.com/avatar/fe0af3575ea6c1fa7881a17aaf72c510"
            className={`u-photo ${styles.avatar}`}
            alt="Avatar of Matt Moriarity"
          />
          <div className={`p-name ${styles.label}`}>Matt Moriarity</div>
        </h1>
      </Link>
    </header>
  )
}

export default Header
