import React, { useState, useEffect, useRef } from 'react';

// ─── Shared name list cache (same as navbar) ──────────────────────────────────
let cachedNames = null;
let fetchPromise = null;

export function getPokemonNames() {
  if (cachedNames) return Promise.resolve(cachedNames);
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch('https://pokeapi.co/api/v2/pokemon?limit=1500')
    .then((r) => r.json())
    .then((data) => {
      cachedNames = data.results.map((p) => p.name);
      return cachedNames;
    });
  return fetchPromise;
}

const MAX_SUGGESTIONS = 8;

// ─── SearchInput ──────────────────────────────────────────────────────────────
// Props:
//   value        — controlled input value
//   onChange     — called with new string on each keystroke
//   onSubmit     — called with the resolved name when user confirms
//   placeholder  — input placeholder text
//   inputClass   — extra class(es) for the <input>
//   inputStyle   — inline style for the <input>
//   suggestClass — extra class for the suggestions list (for position context)

const SearchInput = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Pokémon name…',
  inputClass = '',
  inputStyle = {},
  suggestClass = '',
}) => {
  const [names, setNames] = useState(cachedNames);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!cachedNames) {
      getPokemonNames().then((n) => setNames(n)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!names || !value.trim()) { setSuggestions([]); setActiveIdx(-1); return; }
    const q = value.trim().toLowerCase().replace(/\s+/g, '-');
    const matches = names
      .filter((n) => n.includes(q))
      .sort((a, b) => {
        const aStart = a.startsWith(q), bStart = b.startsWith(q);
        if (aStart && !bStart) return -1;
        if (!aStart && bStart) return 1;
        return a.length - b.length;
      })
      .slice(0, MAX_SUGGESTIONS);
    setSuggestions(matches);
    setActiveIdx(-1);
  }, [value, names]);

  const confirm = (name) => {
    setSuggestions([]);
    setActiveIdx(-1);
    setOpen(false);
    onSubmit(name);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Escape') { setSuggestions([]); setActiveIdx(-1); setOpen(false); }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      confirm(suggestions[activeIdx]);
    } else if (suggestions.length > 0) {
      confirm(suggestions[0]);
    } else {
      const trimmed = value.trim().toLowerCase().replace(/\s+/g, '-');
      if (trimmed) confirm(trimmed);
    }
  };

  const handleBlur = () => {
    setTimeout(() => { setOpen(false); setSuggestions([]); setActiveIdx(-1); }, 150);
  };

  const showSuggestions = open && suggestions.length > 0;

  return (
    <div className={`search-input-wrap ${suggestClass}`}>
      <input
        className={inputClass}
        type="text"
        placeholder={placeholder}
        value={value}
        style={inputStyle}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
      />
      {showSuggestions && (
        <ul className="search-suggestions">
          {suggestions.map((name, i) => (
            <li
              key={name}
              className={`search-suggestion${i === activeIdx ? ' search-suggestion--active' : ''}`}
              onMouseDown={() => confirm(name)}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchInput;
