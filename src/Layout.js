import React from 'react';
import { Link } from 'react-router-dom';

const Layout = (props) => {
    return (
        <React.Fragment>
            <nav className="navbar navbar-light bg-light">
                <Link to="/"><span className="navbar-brand mb-0 h1">Pokemon Encyclopedia</span></Link>
            </nav>
            <div className="container py-3">
                {props.children}
            </div>
            <footer>
                <p className="text-center">©2021 Marques Batoon</p>
            </footer>
        </React.Fragment>
    );
}

export default Layout;