import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';

// ─── Form name formatter ──────────────────────────────────────────────────────
const REGIONAL = { alola: 'Alolan', galar: 'Galarian', hisui: 'Hisuian', paldea: 'Paldean' };

function formatFormName(fullName, baseName) {
  // If this IS the base name, always label it "Base Form"
  if (fullName === baseName) return 'Base Form';

  const parts = fullName.split('-');
  const suffix = parts.slice(1).join('-');
  if (!suffix) return fullName;

  if (REGIONAL[suffix]) return `${REGIONAL[suffix]} Form`;

  const titled = suffix
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `${titled} Forme`;
}

// ─── Stat calculation ─────────────────────────────────────────────────────────
function calcHP(base, level, iv, ev) {
  return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
}
function calcStat(base, level, iv, ev, nature) {
  return Math.floor((Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5) * nature);
}
function getMinMax(base, isHP, level) {
  if (isHP) {
    return { min: calcHP(base, level, 0, 0), max: calcHP(base, level, 31, 252) };
  }
  return { min: calcStat(base, level, 0, 0, 0.9), max: calcStat(base, level, 31, 252, 1.1) };
}

const STATS = [
  { key: 'hp',              label: 'HP',     color: '#ff5959', isHP: true  },
  { key: 'attack',          label: 'Atk',    color: '#f08030', isHP: false },
  { key: 'defense',         label: 'Def',    color: '#f8d030', isHP: false },
  { key: 'special-attack',  label: 'Sp.Atk', color: '#6890f0', isHP: false },
  { key: 'special-defense', label: 'Sp.Def', color: '#78c850', isHP: false },
  { key: 'speed',           label: 'Speed',  color: '#f85888', isHP: false },
];

const BAR_MAX = 255;

// ─── StatPanel ────────────────────────────────────────────────────────────────
class StatPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { animated: false };
  }

  componentDidMount() {
    requestAnimationFrame(() => requestAnimationFrame(() => this.setState({ animated: true })));
  }

  componentDidUpdate(prev) {
    if (prev.stats !== this.props.stats) {
      this.setState({ animated: false }, () => {
        requestAnimationFrame(() => requestAnimationFrame(() => this.setState({ animated: true })));
      });
    }
  }

  render() {
    const { stats } = this.props;
    const { animated } = this.state;
    if (!stats) return null;

    return (
      <div className="stat-panel">
        <div className="stat-panel__header">
          <span className="stat-panel__header-label">Stat</span>
          <span className="stat-panel__header-label stat-panel__header-label--right">Base</span>
          <span className="stat-panel__header-label" style={{ paddingLeft: '0.25rem' }}>Range</span>
          <span className="stat-panel__header-label stat-panel__header-label--right">Lv. 50</span>
          <span className="stat-panel__header-label stat-panel__header-label--right">Lv. 100</span>
        </div>

        {STATS.map((cfg) => {
          const base = stats[cfg.key] || 0;
          const lv50  = getMinMax(base, cfg.isHP, 50);
          const lv100 = getMinMax(base, cfg.isHP, 100);
          const pct   = Math.min((base / BAR_MAX) * 100, 100);

          return (
            <div className="stat-row" key={cfg.key}>
              <span className="stat-row__name" style={{ color: cfg.color }}>{cfg.label}</span>
              <span className="stat-row__base">{base}</span>
              <div className="stat-row__bar-wrap">
                <div
                  className="stat-row__bar"
                  style={{
                    width: animated ? `${pct}%` : '0%',
                    background: `linear-gradient(90deg, ${cfg.color}99, ${cfg.color})`,
                    boxShadow: animated ? `0 0 8px ${cfg.color}66` : 'none',
                    transitionDelay: animated ? '0.05s' : '0s',
                  }}
                />
              </div>
              <div className="stat-row__lv">
                <span className="stat-row__lv-title">min–max</span>
                <span className="stat-row__lv-range">
                  {lv50.min}<span className="stat-row__lv-sep">–</span>{lv50.max}
                </span>
              </div>
              <div className="stat-row__lv">
                <span className="stat-row__lv-title">min–max</span>
                <span className="stat-row__lv-range">
                  {lv100.min}<span className="stat-row__lv-sep">–</span>{lv100.max}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

// ─── Main Pokemon page ────────────────────────────────────────────────────────
class Pokemon extends React.Component {
  constructor(props) {
    super(props);
    const params = new URLSearchParams(props.location.search);
    this.state = {
      name:         params.get('name') || 'MissingNo.',
      region:       params.get('region') || '',  // hint for regional form lookup
      pokeNum:      '',
      imgLink:      '',
      nextMon:      '',
      prevMon:      '',
      disabled:     true,
      nextDisabled: true,
      stats:        null,
      baseExp:      null,
      jaName:       '',
      // All varieties from the species endpoint: [{ name, isDefault }]
      allVarieties: [],
      // The base (default) species name — used for "Base Form" label
      baseName:     '',
    };
  }

  componentDidMount() {
    this.getMon();
  }

  getMon = () => {
    const { name, region } = this.state;
    // If a region hint is provided, try the regional form first (e.g. "vulpix-alola"),
    // then silently fall back to the base name if it doesn't exist.
    const tryFirst = region ? `${name}-${region}` : name;

    fetch(`https://pokeapi.co/api/v2/pokemon/${tryFirst}`)
      .then(checkStatus)
      .then(json)
      .then((data) => this.handleMonData(data))
      .catch(() => {
        // Regional form didn't exist — fall back to the base name
        if (tryFirst !== name) {
          fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
            .then(checkStatus)
            .then(json)
            .then((data) => this.handleMonData(data))
            .catch((err) => console.log(err.message));
        }
      });
  };

  handleMonData = (data) => {
    const stats = {};
    data.stats.forEach((s) => { stats[s.stat.name] = s.base_stat; });

    // Update the displayed name to the actual loaded form (may differ from URL param)
    this.setState({
      name:    data.name,
      imgLink: data.sprites.other['official-artwork']['front_default'],
      stats,
      baseExp: data.base_experience,
    });

    const mon0    = data.species.url;
    const pokeNum = mon0.substring(mon0.lastIndexOf('species') + 8, mon0.lastIndexOf('/'));
    this.setState({ pokeNum });
    this.toNext(1 + parseInt(pokeNum));
    this.toPrev(parseInt(pokeNum) - 1);
    this.getSpeciesData(mon0);
  };

  getSpeciesData = (speciesUrl) => {
    fetch(speciesUrl)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);

        // Japanese name
        const jaEntry = data.names.find((n) => n.language.name === 'ja');
        if (jaEntry) this.setState({ jaName: jaEntry.name });

        // ALL varieties (default + non-default) for the form toggle
        const allVarieties = (data.varieties || []).map((v) => ({
          name:      v.pokemon.name,
          isDefault: v.is_default,
        }));

        // The default variety name = the base species name
        const defaultVariety = allVarieties.find((v) => v.isDefault);
        const baseName = defaultVariety ? defaultVariety.name : this.state.name;

        this.setState({ allVarieties, baseName });
      })
      .catch((err) => console.log(err.message));
  };

  toNext = (num) => {
    fetch(`https://pokeapi.co/api/v2/pokemon/${num}`)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.setState({ nextDisabled: false, nextMon: data.name });
      })
      .catch((err) => console.log(err.message));
  };

  toPrev = (num) => {
    if (num === 0) num = 1;
    fetch(`https://pokeapi.co/api/v2/pokemon/${num}`)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.setState({ disabled: false, prevMon: data.name });
      })
      .catch((err) => console.log(err.message));
  };

  nextPokemon = () => {
    setTimeout(() => { window.location.href = `/pokemon?name=${this.state.nextMon}`; }, 120);
  };

  prevPokemon = () => {
    setTimeout(() => { window.location.href = `/pokemon?name=${this.state.prevMon}`; }, 120);
  };

  render() {
    const { name, imgLink, disabled, nextDisabled, stats, baseExp, jaName, allVarieties, baseName } = this.state;

    // Only show form pills when there are 2+ varieties
    const showForms = allVarieties.length > 1;

    return (
      <div className="pokemon-detail">
        <div className="pokemon-detail__nav">
          <button className="btn-nav btn-nav--prev" onClick={this.prevPokemon} disabled={disabled}>
            ← Prev
          </button>
          <button className="btn-nav btn-nav--next" onClick={this.nextPokemon} disabled={nextDisabled}>
            Next →
          </button>
        </div>

        <div className="pokemon-detail__names">
          <h1 className="pokemon-detail__name">{name}</h1>
          {jaName && <span className="pokemon-detail__ja-name">{jaName}</span>}
        </div>

        {showForms && (
          <div className="pokemon-forms">
            {allVarieties.map((v) => {
              const isActive = v.name === name;
              const label = formatFormName(v.name, baseName);
              return isActive ? (
                <span key={v.name} className="pokemon-form-pill pokemon-form-pill--active">
                  {label}
                </span>
              ) : (
                <a key={v.name} href={`/pokemon?name=${v.name}`} className="pokemon-form-pill">
                  {label}
                </a>
              );
            })}
          </div>
        )}

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-5 pokemon-detail__image-wrap">
              {imgLink && (
                <img
                  className="mon100"
                  src={imgLink}
                  alt={name}
                  style={baseExp != null ? (() => {
                    const MIN_EXP = 36, MAX_EXP = 340, MIN_PX = 110, MAX_PX = 290;
                    const clamped = Math.max(MIN_EXP, Math.min(MAX_EXP, baseExp));
                    const size = Math.round(MIN_PX + (clamped - MIN_EXP) / (MAX_EXP - MIN_EXP) * (MAX_PX - MIN_PX));
                    return { width: size, height: size };
                  })() : {}}
                />
              )}
            </div>
            <div className="col-12 col-md-7">
              <StatPanel stats={stats} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Pokemon;
