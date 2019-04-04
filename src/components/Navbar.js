import React from "react";
import { Link } from "gatsby";

const NavItem = ({ className, ...props }) => {
  className = className || "";
  return (
    <li
      className={`pt-2 pb-1 mx-1 my-0 px-1 border-solid border-0 border-b-4 border-transparent hover:border-purple-300 ${className}`}
      {...props}
    />
  );
};

const Navbar = () => {
  return (
    <nav
      className="max-w-lg mx-auto mb-2"
      role="navigation"
      aria-label="main-navigation"
    >
      <ul className="list-none m-0 p-0 flex flex-row justify-center bg-purple-100 mt-3 mb-4 sm:rounded-lg shadow-md">
        <NavItem>
          <Link to="/" className="text-purple-600 no-underline">
            Home
          </Link>
        </NavItem>
        <NavItem>
          <Link to="/about" className="text-purple-600 no-underline">
            About
          </Link>
        </NavItem>
        <NavItem>
          <Link to="/music" className="text-purple-600 no-underline">
            Music
          </Link>
        </NavItem>
        <NavItem>
          <Link to="/talks" className="text-purple-600 no-underline">
            Talks
          </Link>
        </NavItem>
      </ul>
    </nav>
  );
};

export default Navbar;
