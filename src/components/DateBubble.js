import React from "react"
import { Link } from "gatsby"
import styles from "./DateBubble.module.scss"

const DateBubble = ({ isoDate, className, ...props }) => {
  return (
    <time
      className={`${className} ${styles.bubble}`}
      dateTime={isoDate}
      {...props}
    />
  )
}

export const DateBubbleLink = ({
  isoDate,
  linkClassName,
  className,
  children,
  ...props
}) => {
  return (
    <Link className={`${linkClassName} ${styles.link}`} {...props}>
      ➔{" "}
      <time className={`${className}`} dateTime={isoDate}>
        {children}
      </time>
    </Link>
  )
}

export default DateBubble
