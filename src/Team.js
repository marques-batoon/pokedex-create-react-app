import React from 'react';
import ReactDOM from 'react-dom';
import { checkStatus, json } from './utils/fetchUtils';
import SearchInput from './SearchInput';
import { TypeBadge } from './typeColors';

const CANONICAL_FORMS = {
  'giratina': 'giratina-altered', 'shaymin': 'shaymin-land',
  'basculin': 'basculin-red-striped', 'keldeo': 'keldeo-ordinary',
  'meloetta': 'meloetta-aria', 'lycanroc': 'lycanroc-midday',
  'toxtricity': 'toxtricity-amped', 'indeedee': 'indeedee-male',
  'morpeko': 'morpeko-full-belly', 'urshifu': 'urshifu-single-strike',
  'enamorus': 'enamorus-incarnate',
};

function getArtwork(data) {
  return (
    data.sprites.other?.['official-artwork']?.['front_default'] ||
    data.sprites.other?.['official-artwork']?.['front_shiny'] ||
    data.sprites.other?.home?.front_default ||
    data.sprites.front_default || ''
  );
}

// ─── Single slot input ────────────────────────────────────────────────────────
class TeamSlot extends React.Component {
  constructor(props) {
    super(props);
    this.state = { query: '', loading: false, error: '' };
  }

  fetchPokemon = (name) => {
    const trimmed = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed) return;
    this.setState({ loading: true, error: '' });
    const canonical = CANONICAL_FORMS[trimmed] || trimmed;
    fetch(`https://pokeapi.co/api/v2/pokemon/${canonical}`)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        this.setState({ loading: false, query: '' });
        this.props.onLoad({
          name:    data.name,
          sprite:  data.sprites.front_default,
          imgLink: getArtwork(data),
          types:   data.types.map((t) => t.type.name),
        });
      })
      .catch(() => this.setState({ loading: false, error: 'Not found' }));
  };

  render() {
    const { mon, index } = this.props;
    const { query, loading, error } = this.state;
    const slotNum = index + 1;

    return (
      <div className={`team-slot${mon ? ' team-slot--filled' : ''}`}>
        <div className="team-slot__number">{slotNum}</div>

        {mon ? (
          <div className="team-slot__preview">
            <img src={mon.sprite} alt={mon.name} className="team-slot__sprite" />
            <div className="team-slot__info">
              <span className="team-slot__name">{mon.name}</span>
              <div className="team-slot__types">
                {mon.types.map((t) => <TypeBadge key={t} type={t} />)}
              </div>
            </div>
            <button
              className="team-slot__remove"
              onClick={this.props.onRemove}
              title="Remove"
            >×</button>
          </div>
        ) : (
          <div className="team-slot__form">
            <SearchInput
              value={query}
              onChange={(v) => this.setState({ query: v })}
              onSubmit={this.fetchPokemon}
              placeholder={`Pokémon ${slotNum}…`}
              inputClass="team-slot__input"
              suggestClass="team-slot__suggest-wrap"
            />
            <button
              className="team-slot__btn"
              type="button"
              onClick={() => this.fetchPokemon(query)}
            >
              {loading ? '…' : '+'}
            </button>
          </div>
        )}
        {error && <p className="team-slot__error">{error}</p>}
      </div>
    );
  }
}


// ─── DraggableSprite ──────────────────────────────────────────────────────────
// Two-element design:
//   outer <div>  — handles absolute positioning via left/top (drag target)
//   inner <img>  — plays CSS reveal/tap animations independently
// This separates drag state from CSS animations so they never conflict.
class DraggableSprite extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Absolute pixel position, initialised lazily on first drag
      x: null, y: null,
      dragging: false,
      tapping: false,
    };
    this._startMouseX = 0; this._startMouseY = 0;
    this._startX = 0;      this._startY = 0;
    this._moved = false;
    this._tapTimer = null;
    this.wrapRef = React.createRef();
  }

  componentWillUnmount() {
    this._removeListeners();
    clearTimeout(this._tapTimer);
  }

  onPointerDown = (e) => {
    if (!this.props.draggable) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;

    // On first drag, snapshot the element's current screen position
    // so drag continues from exactly where it sits (accounting for the
    // entrance animation that used CSS transforms).
    let startX = this.state.x;
    let startY = this.state.y;
    if (startX === null) {
      const rect = this.wrapRef.current.getBoundingClientRect();
      startX = rect.left;
      startY = rect.top;
    }

    this._startMouseX = pt.clientX;
    this._startMouseY = pt.clientY;
    this._startX = startX;
    this._startY = startY;
    this._moved = false;

    this.setState({ dragging: true, x: startX, y: startY });
    this._addListeners();
  };

  onPointerMove = (e) => {
    const pt = e.touches ? e.touches[0] : e;
    const ddx = pt.clientX - this._startMouseX;
    const ddy = pt.clientY - this._startMouseY;
    if (Math.abs(ddx) > 4 || Math.abs(ddy) > 4) this._moved = true;
    this.setState({ x: this._startX + ddx, y: this._startY + ddy });
  };

  onPointerUp = () => {
    this.setState({ dragging: false });
    this._removeListeners();
    if (!this._moved) this.triggerTap();
  };

  _addListeners = () => {
    window.addEventListener('mousemove', this.onPointerMove);
    window.addEventListener('mouseup', this.onPointerUp);
    window.addEventListener('touchmove', this.onPointerMove, { passive: false });
    window.addEventListener('touchend', this.onPointerUp);
  };

  _removeListeners = () => {
    window.removeEventListener('mousemove', this.onPointerMove);
    window.removeEventListener('mouseup', this.onPointerUp);
    window.removeEventListener('touchmove', this.onPointerMove);
    window.removeEventListener('touchend', this.onPointerUp);
  };

  triggerTap = () => {
    // Force re-trigger by toggling off then on in next frame
    this.setState({ tapping: false }, () => {
      requestAnimationFrame(() => {
        this.setState({ tapping: true });
        clearTimeout(this._tapTimer);
        this._tapTimer = setTimeout(() => this.setState({ tapping: false }), 600);
      });
    });
  };

  render() {
    const { src, alt, index, visible } = this.props;
    const { x, y, dragging, tapping } = this.state;

    const positioned = x !== null;

    // Outer wrapper: either CSS-positioned (during/after drag) or
    // flow-positioned (before first drag, so the CSS entrance animation works).
    const wrapStyle = positioned
      ? {
          position: 'fixed',
          left: x,
          top:  y,
          width: 96,
          height: 96,
          zIndex: dragging ? 1000 : 10 + index,
          cursor: dragging ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
        }
      : {
          // Pre-drag: sit inside .victory-team flow so the CSS animation runs
          position: 'absolute',
          bottom: 0,
          left: `calc(${index} * 64px)`,
          width: 96,
          height: 96,
          zIndex: index,
          cursor: 'grab',
          pointerEvents: 'auto',
        };

    const imgClasses = [
      'victory-sprite-img',
      visible  ? 'victory-sprite-img--visible'  : '',
      dragging ? 'victory-sprite-img--dragging'  : '',
      tapping  ? 'victory-sprite-img--tap'       : '',
    ].filter(Boolean).join(' ');

    return (
      <div
        ref={this.wrapRef}
        style={wrapStyle}
        onMouseDown={this.onPointerDown}
        onTouchStart={this.onPointerDown}
      >
        <img
          src={src}
          alt={alt}
          className={imgClasses}
          style={{ '--delay': `${index * 0.08}s` }}
          draggable={false}
        />
      </div>
    );
  }
}

// ─── Victory Presentation overlay ─────────────────────────────────────────────
class VictoryScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phase: 'intro',   // intro → title → reveal → done
      revealed: 0,
    };
  }

  componentDidMount() {
    // Phase sequence: dark flash → title → reveal mons one by one
    setTimeout(() => this.setState({ phase: 'title' }), 400);
    setTimeout(() => this.startReveal(), 1800);
  }

  startReveal = () => {
    this.setState({ phase: 'reveal', revealed: 0 });
    this.props.team.forEach((_, i) => {
      setTimeout(() => {
        this.setState((s) => ({ revealed: s.revealed + 1 }));
      }, i * 380);
    });
    setTimeout(() => {
      this.setState({ phase: 'done' });
    }, this.props.team.length * 380 + 600);
  };

  render() {
    const { team, onClose, championName } = this.props;
    const validName = championName && championName.length >= 3 && championName.length <= 15;
    const displayTitle = validName ? championName : 'Your Team';
    const { phase, revealed } = this.state;

    return ReactDOM.createPortal(
      <div className={`victory-overlay victory-overlay--${phase}`}>
        {/* Animated star-burst background rays */}
        <div className="victory-rays">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="victory-ray" style={{ '--i': i }} />
          ))}
        </div>

        {/* Pokéball flash */}
        <div className="victory-flash" />

        {/* Champion title */}
        <div className={`victory-title${phase === 'title' || phase === 'reveal' || phase === 'done' ? ' victory-title--visible' : ''}`}>
          <span className="victory-title__top">✦ Champion ✦</span>
          <span className="victory-title__main">{displayTitle}</span>
        </div>

        {/* Layered sprites — draggable once fully revealed */}
        {(phase === 'reveal' || phase === 'done') && (
          <div className="victory-team">
            {team.map((mon, i) => (
              <DraggableSprite
                key={mon.name}
                src={mon.sprite}
                alt={mon.name}
                index={i}
                visible={i < revealed}
                draggable={phase === 'done'}
              />
            ))}
          </div>
        )}

        {/* Close button appears after all sprites revealed */}
        {phase === 'done' && (
          <button className="victory-close" onClick={onClose}>
            ← Edit Team
          </button>
        )}
      </div>,
      document.body
    );
  }
}

// Map primary type → glow color for the card backdrop
const TYPE_GLOW = {
  fire: 'rgba(248,112,48,0.35)', water: 'rgba(104,144,240,0.35)',
  grass: 'rgba(120,200,80,0.35)', electric: 'rgba(248,208,48,0.35)',
  psychic: 'rgba(248,88,136,0.35)', dragon: 'rgba(112,56,248,0.35)',
  dark: 'rgba(112,88,72,0.35)', fairy: 'rgba(238,153,172,0.35)',
  steel: 'rgba(184,184,208,0.35)', ice: 'rgba(152,216,216,0.35)',
  ghost: 'rgba(112,88,152,0.35)', fighting: 'rgba(192,48,40,0.35)',
  rock: 'rgba(184,160,56,0.35)', ground: 'rgba(224,192,104,0.35)',
  bug: 'rgba(168,184,32,0.35)', poison: 'rgba(160,64,160,0.35)',
  flying: 'rgba(168,144,240,0.35)', normal: 'rgba(168,168,120,0.35)',
};
function getTypeGlow(type) {
  return TYPE_GLOW[type] || 'rgba(255,203,5,0.25)';
}

// ─── Main Team page ───────────────────────────────────────────────────────────
const TEAM_SIZE = 6;

class Team extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      team: Array(TEAM_SIZE).fill(null),
      presenting: false,
      championName: '',
    };
  }

  setSlot = (index, mon) => {
    this.setState((s) => {
      const team = [...s.team];
      team[index] = mon;
      return { team };
    });
  };

  removeSlot = (index) => {
    this.setState((s) => {
      const team = [...s.team];
      team[index] = null;
      return { team };
    });
  };

  get filledTeam() {
    return this.state.team.filter(Boolean);
  }

  render() {
    const { team, presenting } = this.state;
    const filled = this.filledTeam;
    const allFull = filled.length === TEAM_SIZE;

    if (presenting) {
      return (
        <VictoryScreen
          team={filled}
          championName={this.state.championName.trim()}
          onClose={() => this.setState({ presenting: false })}
        />
      );
    }

    return (
      <div className="team-page">
        <h1 className="page-title">My Team</h1>
        <p className="team-page__sub">
          Build your party of 6 — then present them like a Champion.
        </p>

        <div className="team-slots">
          {team.map((mon, i) => (
            <TeamSlot
              key={i}
              index={i}
              mon={mon}
              onLoad={(m) => this.setSlot(i, m)}
              onRemove={() => this.removeSlot(i)}
            />
          ))}
        </div>

        <div className="team-name-input">
          <label className="team-name-input__label" htmlFor="champion-name">
            Champion Name <span className="team-name-input__hint">(optional, 3–15 chars)</span>
          </label>
          <input
            id="champion-name"
            className="team-name-input__field"
            type="text"
            maxLength={15}
            placeholder="Enter your name…"
            value={this.state.championName}
            onChange={(e) => this.setState({ championName: e.target.value })}
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <div className="team-page__actions">
          <button
            className={`team-present-btn${allFull ? ' team-present-btn--ready' : ''}`}
            disabled={!allFull}
            onClick={() => this.setState({ presenting: true })}
          >
            {allFull ? '✦ Present Your Team ✦' : `${filled.length} / ${TEAM_SIZE} Pokémon chosen`}
          </button>
          {filled.length > 0 && (
            <button
              className="team-clear-btn"
              onClick={() => this.setState({ team: Array(TEAM_SIZE).fill(null) })}
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default Team;
