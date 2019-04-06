import React from "react";
import { Link } from "gatsby";

const Header = () => {
  return (
    <header className="h-card text-center pt-6 pb-3">
      <Link to="/" title="Home" className="u-url text-purple-900 no-underline">
        <h1 className="flex items-center justify-center font-normal text-3xl sm:text-4xl p-0 m-0">
          <img
            src="https://gravatar.com/avatar/fe0af3575ea6c1fa7881a17aaf72c510"
            className="u-photo w-8 sm:w-10 h-8 sm:h-10 rounded-full m-0 mr-2 sm:mr-3"
            alt="Avatar of Matt Moriarity"
          />
          <div className="p-name mt-2">Matt Moriarity</div>
        </h1>
      </Link>
    </header>
  );
};

export default Header;
