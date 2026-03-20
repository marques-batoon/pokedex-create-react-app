import React from 'react';
import ReactDOM from 'react-dom';
import { checkStatus, json } from './utils/fetchUtils';
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

  handleSearch = (e) => {
    e.preventDefault();
    const trimmed = this.state.query.trim().toLowerCase().replace(/\s+/g, '-');
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
      .catch(() => this.setState({ loading: false, error: `Not found` }));
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
          <form className="team-slot__form" onSubmit={this.handleSearch}>
            <input
              className="team-slot__input"
              type="text"
              placeholder={`Pokémon ${slotNum}…`}
              value={query}
              onChange={(e) => this.setState({ query: e.target.value })}
              spellCheck={false}
              autoComplete="off"
            />
            <button className="team-slot__btn" type="submit">
              {loading ? '…' : '+'}
            </button>
          </form>
        )}
        {error && <p className="team-slot__error">{error}</p>}
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
    const { team, onClose } = this.props;
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
          <span className="victory-title__main">Your Team</span>
        </div>

        {/* Layered sprites */}
        {(phase === 'reveal' || phase === 'done') && (
          <div className="victory-team">
            {team.map((mon, i) => (
              <img
                key={mon.name}
                src={mon.sprite}
                alt={mon.name}
                className={`victory-sprite${i < revealed ? ' victory-sprite--visible' : ''}`}
                style={{ '--i': i, '--delay': `${i * 0.08}s` }}
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
