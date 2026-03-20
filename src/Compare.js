import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';

// ─── Shared stat config ───────────────────────────────────────────────────────
const STATS = [
  { key: 'hp',              label: 'HP',     color: '#ff5959', isHP: true  },
  { key: 'attack',          label: 'Atk',    color: '#f08030', isHP: false },
  { key: 'defense',         label: 'Def',    color: '#f8d030', isHP: false },
  { key: 'special-attack',  label: 'Sp.Atk', color: '#6890f0', isHP: false },
  { key: 'special-defense', label: 'Sp.Def', color: '#78c850', isHP: false },
  { key: 'speed',           label: 'Speed',  color: '#f85888', isHP: false },
];

const BAR_MAX = 255;

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
    data.sprites.front_default ||
    ''
  );
}

function buildStats(data) {
  const stats = {};
  data.stats.forEach((s) => { stats[s.stat.name] = s.base_stat; });
  return stats;
}

function totalStats(statsObj) {
  return STATS.reduce((sum, cfg) => sum + (statsObj[cfg.key] || 0), 0);
}

// ─── PokemonSlot — one search + card ─────────────────────────────────────────
class PokemonSlot extends React.Component {
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
        this.setState({ loading: false });
        this.props.onLoad({
          name:    data.name,
          imgLink: getArtwork(data),
          stats:   buildStats(data),
          baseExp: data.base_experience,
        });
      })
      .catch(() => {
        this.setState({ loading: false, error: `"${trimmed}" not found.` });
      });
  };

  render() {
    const { mon, accentColor } = this.props;
    const { query, loading, error } = this.state;

    return (
      <div className="compare-slot">
        {/* Search form */}
        <form className="compare-slot__form" onSubmit={this.handleSearch}>
          <input
            className="compare-slot__input"
            type="text"
            placeholder="Enter Pokémon name…"
            value={query}
            onChange={(e) => this.setState({ query: e.target.value })}
            spellCheck={false}
            autoComplete="off"
            style={{ '--slot-color': accentColor }}
          />
          <button className="compare-slot__btn" type="submit" style={{ background: accentColor }}>
            {loading ? '…' : 'Go'}
          </button>
        </form>
        {error && <p className="compare-slot__error">{error}</p>}

        {/* Card */}
        {mon ? (
          <div className="compare-slot__card" style={{ '--slot-color': accentColor }}>
            <div className="compare-slot__img-wrap">
              <img
                className="compare-slot__img"
                src={mon.imgLink}
                alt={mon.name}
              />
            </div>
            <p className="compare-slot__name">{mon.name}</p>
            <p className="compare-slot__total">
              BST <span>{totalStats(mon.stats)}</span>
            </p>
          </div>
        ) : (
          <div className="compare-slot__empty">
            <span>?</span>
          </div>
        )}
      </div>
    );
  }
}

// ─── Head-to-head stat bars ───────────────────────────────────────────────────
class CompareStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = { animated: false };
  }

  componentDidMount() {
    requestAnimationFrame(() => requestAnimationFrame(() => this.setState({ animated: true })));
  }

  componentDidUpdate(prev) {
    if (prev.monA !== this.props.monA || prev.monB !== this.props.monB) {
      this.setState({ animated: false }, () => {
        requestAnimationFrame(() => requestAnimationFrame(() => this.setState({ animated: true })));
      });
    }
  }

  render() {
    const { monA, monB, colorA, colorB } = this.props;
    const { animated } = this.state;

    return (
      <div className="compare-stats">
        <div className="compare-stats__header">
          <span className="compare-stats__name" style={{ color: colorA }}>{monA?.name || '—'}</span>
          <span className="compare-stats__label">Stat</span>
          <span className="compare-stats__name" style={{ color: colorB }}>{monB?.name || '—'}</span>
        </div>

        {STATS.map((cfg) => {
          const a = monA?.stats[cfg.key] || 0;
          const b = monB?.stats[cfg.key] || 0;
          const maxVal = Math.max(a, b, 1);
          const pctA = Math.min((a / BAR_MAX) * 100, 100);
          const pctB = Math.min((b / BAR_MAX) * 100, 100);
          const aWins = a > b;
          const bWins = b > a;

          return (
            <div className="compare-row" key={cfg.key}>
              {/* Left: Pokémon A bar (grows left) */}
              <div className="compare-row__side compare-row__side--left">
                <span
                  className={`compare-row__val${aWins ? ' compare-row__val--winner' : ''}`}
                  style={{ color: aWins ? colorA : 'var(--text-muted)' }}
                >
                  {monA ? a : '—'}
                </span>
                <div className="compare-row__track">
                  <div
                    className="compare-row__bar compare-row__bar--left"
                    style={{
                      width: animated && monA ? `${pctA}%` : '0%',
                      background: `linear-gradient(270deg, ${colorA}99, ${colorA})`,
                      boxShadow: animated && aWins ? `0 0 8px ${colorA}88` : 'none',
                    }}
                  />
                </div>
              </div>

              {/* Centre label */}
              <span className="compare-row__label" style={{ color: cfg.color }}>
                {cfg.label}
              </span>

              {/* Right: Pokémon B bar (grows right), val on left of bar */}
              <div className="compare-row__side compare-row__side--right">
                <span
                  className={`compare-row__val${bWins ? ' compare-row__val--winner' : ''}`}
                  style={{ color: bWins ? colorB : 'var(--text-muted)' }}
                >
                  {monB ? b : '—'}
                </span>
                <div className="compare-row__track">
                  <div
                    className="compare-row__bar compare-row__bar--right"
                    style={{
                      width: animated && monB ? `${pctB}%` : '0%',
                      background: `linear-gradient(90deg, ${colorB}99, ${colorB})`,
                      boxShadow: animated && bWins ? `0 0 8px ${colorB}88` : 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* BST totals row */}
        {(monA || monB) && (() => {
          const totA = monA ? totalStats(monA.stats) : 0;
          const totB = monB ? totalStats(monB.stats) : 0;
          return (
            <div className="compare-row compare-row--total">
              <div className="compare-row__side compare-row__side--left">
                <span style={{ color: totA >= totB ? colorA : 'var(--text-muted)', fontWeight: 800 }}>
                  {monA ? totA : '—'}
                </span>
              </div>
              <span className="compare-row__label" style={{ color: 'var(--text-primary)' }}>BST</span>
              <div className="compare-row__side compare-row__side--right">
                <span style={{ color: totB >= totA ? colorB : 'var(--text-muted)', fontWeight: 800 }}>
                  {monB ? totB : '—'}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }
}

// ─── Compare page ─────────────────────────────────────────────────────────────
const COLOR_A = '#6890f0'; // blue
const COLOR_B = '#f08030'; // orange

class Compare extends React.Component {
  constructor(props) {
    super(props);
    this.state = { monA: null, monB: null };
  }

  render() {
    const { monA, monB } = this.state;

    return (
      <div className="compare-page">
        <h1 className="page-title">Compare</h1>

        <div className="compare-slots">
          <PokemonSlot
            mon={monA}
            accentColor={COLOR_A}
            onLoad={(mon) => this.setState({ monA: mon })}
          />
          <div className="compare-vs">VS</div>
          <PokemonSlot
            mon={monB}
            accentColor={COLOR_B}
            onLoad={(mon) => this.setState({ monB: mon })}
          />
        </div>

        <CompareStats monA={monA} monB={monB} colorA={COLOR_A} colorB={COLOR_B} />
      </div>
    );
  }
}

export default Compare;
