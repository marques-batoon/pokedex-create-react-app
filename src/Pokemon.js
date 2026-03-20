import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';

// ─── Stat calculation (standard competitive formulas) ────────────────────────
// HP:    floor((2*Base + IV + floor(EV/4)) * Lv/100) + Lv + 10
// Other: floor((floor((2*Base + IV + floor(EV/4)) * Lv/100) + 5) * Nature)
//
// Min = 0 IV, 0 EV, hindering nature (×0.9, not applied to HP)
// Max = 31 IV, 252 EV → floor(252/4)=63, beneficial nature (×1.1, not for HP)

function calcHP(base, level, iv, ev) {
  return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
}

function calcStat(base, level, iv, ev, nature) {
  return Math.floor((Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5) * nature);
}

function getMinMax(base, isHP, level) {
  if (isHP) {
    return {
      min: calcHP(base, level, 0, 0),
      max: calcHP(base, level, 31, 252),
    };
  }
  return {
    min: calcStat(base, level, 0, 0, 0.9),
    max: calcStat(base, level, 31, 252, 1.1),
  };
}

// ─── Stat config ──────────────────────────────────────────────────────────────
const STATS = [
  { key: 'hp',              label: 'HP',     color: '#ff5959', isHP: true  },
  { key: 'attack',          label: 'Atk',    color: '#f08030', isHP: false },
  { key: 'defense',         label: 'Def',    color: '#f8d030', isHP: false },
  { key: 'special-attack',  label: 'Sp.Atk', color: '#6890f0', isHP: false },
  { key: 'special-defense', label: 'Sp.Def', color: '#78c850', isHP: false },
  { key: 'speed',           label: 'Speed',  color: '#f85888', isHP: false },
];

// Max possible stat value (for bar scaling). Highest base stat is 255 (Blissey HP).
// At lv100, max HP ≈ 714 and max other ≈ 800+ with nature/EVs — use 714 / 800 as bar ceiling.
const BAR_MAX = 255; // base stat bar is scaled against 255

// ─── StatPanel component ──────────────────────────────────────────────────────
class StatPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { animated: false };
    this.rowRefs = STATS.map(() => React.createRef());
  }

  componentDidMount() {
    // Tiny delay lets the browser paint at width:0 first so the transition fires
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.setState({ animated: true });
      });
    });
  }

  componentDidUpdate(prev) {
    if (prev.stats !== this.props.stats) {
      this.setState({ animated: false }, () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => this.setState({ animated: true }));
        });
      });
    }
  }

  render() {
    const { stats } = this.props;
    const { animated } = this.state;

    if (!stats) return null;

    return (
      <div className="stat-panel">
        {/* Column headers */}
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
              {/* Name */}
              <span className="stat-row__name" style={{ color: cfg.color }}>
                {cfg.label}
              </span>

              {/* Base value */}
              <span className="stat-row__base">{base}</span>

              {/* Bar */}
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

              {/* Lv. 50 min–max */}
              <div className="stat-row__lv">
                <span className="stat-row__lv-title">min–max</span>
                <span className="stat-row__lv-range">
                  {lv50.min}
                  <span className="stat-row__lv-sep">–</span>
                  {lv50.max}
                </span>
              </div>

              {/* Lv. 100 min–max */}
              <div className="stat-row__lv">
                <span className="stat-row__lv-title">min–max</span>
                <span className="stat-row__lv-range">
                  {lv100.min}
                  <span className="stat-row__lv-sep">–</span>
                  {lv100.max}
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
      pokeNum:      '',
      imgLink:      '',
      nextMon:      '',
      prevMon:      '',
      disabled:     true,
      nextDisabled: true,
      stats:        null,
      baseExp:      null,
      jaName:       '',
    };
  }

  componentDidMount() {
    this.getMon();
  }

  getMon = () => {
    fetch(`https://pokeapi.co/api/v2/pokemon/${this.state.name}`)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);

        // Build stats map keyed by stat name
        const stats = {};
        data.stats.forEach((s) => {
          stats[s.stat.name] = s.base_stat;
        });

        this.setState({
          imgLink:  data.sprites.other['official-artwork']['front_default'],
          stats,
          baseExp:  data.base_experience,
        });

        const mon0    = data.species.url;
        const pokeNum = mon0.substring(mon0.lastIndexOf('species') + 8, mon0.lastIndexOf('/'));
        this.setState({ pokeNum });
        this.toNext(1 + parseInt(pokeNum));
        this.toPrev(parseInt(pokeNum) - 1);
        this.getJaName(mon0);
      })
      .catch((error) => console.log(error.message));
  };

  getJaName = (speciesUrl) => {
    fetch(speciesUrl)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const jaEntry = data.names.find((n) => n.language.name === 'ja');
        if (jaEntry) this.setState({ jaName: jaEntry.name });
      })
      .catch((error) => console.log(error.message));
  };

  toNext = (num) => {
    fetch(`https://pokeapi.co/api/v2/pokemon/${num}`)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.setState({ nextDisabled: false, nextMon: data.name });
      })
      .catch((error) => console.log(error.message));
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
      .catch((error) => console.log(error.message));
  };

  nextPokemon = () => {
    setTimeout(() => {
      window.location.href = `/pokemon?name=${this.state.nextMon}`;
    }, 120);
  };

  prevPokemon = () => {
    setTimeout(() => {
      window.location.href = `/pokemon?name=${this.state.prevMon}`;
    }, 120);
  };

  render() {
    const { name, imgLink, disabled, nextDisabled, stats, baseExp, jaName } = this.state;

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
