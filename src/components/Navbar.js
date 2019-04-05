import React from "react";
import { Link } from "gatsby";

const linkClassName =
  "block pt-2 pb-1 mx-1 my-0 px-1 border-solid border-0 border-b-4 border-transparent hover:border-purple-300 text-purple-600 no-underline";
const activeLinkClassName =
  "font-bold border-purple-500 hover:border-purple-500";

const Navbar = () => {
  return (
    <nav
      className="max-w-lg mx-auto mb-2"
      role="navigation"
      aria-label="main-navigation"
    >
      <ul className="list-none m-0 p-0 flex flex-row justify-center bg-purple-100 mt-3 mb-4 sm:rounded-lg shadow-md">
        <li className="m-0 p-0">
          <Link
            to="/"
            className={linkClassName}
            activeClassName={activeLinkClassName}
          >
            Home
          </Link>
        </li>
        <li className="m-0 p-0">
          <Link
            to="/about/"
            className={linkClassName}
            activeClassName={activeLinkClassName}
          >
            About
          </Link>
        </li>
        <li className="m-0 p-0">
          <Link
            to="/music/"
            className={linkClassName}
            activeClassName={activeLinkClassName}
          >
            Music
          </Link>
        </li>
        <li className="m-0 p-0">
          <Link
            to="/talks/"
            className={linkClassName}
            activeClassName={activeLinkClassName}
          >
            Talks
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
