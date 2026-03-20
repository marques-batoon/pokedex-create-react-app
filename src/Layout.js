import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="22" y2="22" />
  </svg>
);

const NavSearch = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed) return;
    setQuery('');
    if (onNavigate) onNavigate();
    window.location.href = `/pokemon?name=${trimmed}`;
  };

  return (
    <form className={`nav-search${focused ? ' nav-search--focused' : ''}`} onSubmit={handleSubmit}>
      <span className="nav-search__icon"><SearchIcon /></span>
      <input
        className="nav-search__input"
        type="text"
        placeholder="Search Pokémon…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        spellCheck={false}
        autoComplete="off"
      />
    </form>
  );
};

const NAV_LINKS = [
  { to: '/challenge', label: 'Challenge', className: 'poke-navbar__challenge-link' },
  { to: '/team',      label: 'Team',      className: '' },
  { to: '/compare',   label: 'Compare',   className: '' },
];

const Layout = (props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <React.Fragment>
      <nav className="poke-navbar">
        <Link to="/" className="poke-navbar__brand" onClick={close}>
          <div className="poke-navbar__logo" />
          <span>Pokédex</span>
        </Link>

        {/* Desktop right group */}
        <div className="poke-navbar__right poke-navbar__right--desktop">
          {NAV_LINKS.map(({ to, label, className }) => (
            <Link key={to} to={to} className={`poke-navbar__compare-link ${className}`}>
              {label}
            </Link>
          ))}
          <NavSearch />
        </div>

        {/* Mobile: search + hamburger */}
        <div className="poke-navbar__right poke-navbar__right--mobile">
          <NavSearch onNavigate={close} />
          <button
            className={`poke-hamburger${menuOpen ? ' poke-hamburger--open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="poke-drawer" onClick={close}>
          <div className="poke-drawer__inner" onClick={(e) => e.stopPropagation()}>
            {NAV_LINKS.map(({ to, label, className }) => (
              <Link
                key={to}
                to={to}
                className={`poke-drawer__link ${className}`}
                onClick={close}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <main className="main-content">
        {props.children}
      </main>

      <footer className="poke-footer">
        <div className="poke-footer__links">
          <a href="https://www.github.com/marques-batoon" rel="noreferrer" target="_blank" className="poke-footer__link">
            <GitHubIcon /> GitHub
          </a>
          <a href="https://www.instagram.com/batoonworld/" rel="noreferrer" target="_blank" className="poke-footer__link">
            <InstagramIcon /> Instagram
          </a>
        </div>
        <p className="poke-footer__copy">©2026 Marques Batoon</p>
      </footer>
    </React.Fragment>
  );
};

export default Layout;
