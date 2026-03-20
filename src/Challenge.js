import React from 'react';
import ReactDOM from 'react-dom';
import { checkStatus, json } from './utils/fetchUtils';

const STAT_KEYS = [
  { key: 'hp',              label: 'HP' },
  { key: 'attack',          label: 'Attack' },
  { key: 'defense',         label: 'Defense' },
  { key: 'special-attack',  label: 'Sp. Attack' },
  { key: 'special-defense', label: 'Sp. Defense' },
  { key: 'speed',           label: 'Speed' },
];

const MAX_POKEMON_ID = 1025; // up to gen 9 nationals

function randomId() {
  return Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
}

function randomStat() {
  return STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)];
}

function getArtwork(data) {
  return (
    data.sprites.other?.['official-artwork']?.['front_default'] ||
    data.sprites.other?.home?.front_default ||
    data.sprites.front_default || ''
  );
}

function buildMon(data) {
  const stats = {};
  data.stats.forEach((s) => { stats[s.stat.name] = s.base_stat; });
  return {
    id:      data.id,
    name:    data.name,
    imgLink: getArtwork(data),
    stats,
  };
}

async function fetchMon(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  checkStatus(res);
  const data = await res.json();
  return buildMon(data);
}

// ─── Game Over overlay ────────────────────────────────────────────────────────
const GameOver = ({ streak, best, onRetry }) =>
  ReactDOM.createPortal(
    <div className="challenge-gameover">
      <div className="challenge-gameover__rays">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="challenge-gameover__ray" style={{ '--i': i }} />
        ))}
      </div>
      <div className="challenge-gameover__box">
        <span className="challenge-gameover__label">Streak ended</span>
        <span className="challenge-gameover__score">{streak}</span>
        {best > 0 && (
          <span className="challenge-gameover__best">
            Best&nbsp;<strong>{best}</strong>
          </span>
        )}
        <button className="challenge-gameover__retry" onClick={onRetry}>
          Try Again?
        </button>
      </div>
    </div>,
    document.body
  );

// ─── Main Challenge page ──────────────────────────────────────────────────────
class Challenge extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      monA:       null,
      monB:       null,
      stat:       null,
      loading:    true,
      streak:     0,
      best:       0,
      phase:      'playing',   // playing | correct | wrong | gameover
      chosenSide: null,        // 'A' | 'B' — which button the user pressed
    };
  }

  componentDidMount() {
    this.startRound(null, null);
  }

  // Load a fresh round. If prevB is supplied it becomes the new A (chaining).
  startRound = async (prevB, prevStat) => {
    this.setState({ loading: true, phase: 'playing', chosenSide: null });
    try {
      const monA = prevB || await fetchMon(randomId());
      // Keep picking until we get a Pokémon different from A
      let monB;
      do { monB = await fetchMon(randomId()); } while (monB.id === monA.id);
      const stat = randomStat();
      this.setState({ monA, monB, stat, loading: false });
    } catch (e) {
      // Retry on network hiccup
      this.startRound(prevB, prevStat);
    }
  };

  handleGuess = (side) => {
    const { monA, monB, stat, streak, best, phase } = this.state;
    if (phase !== 'playing') return;

    const valA = monA.stats[stat.key];
    const valB = monB.stats[stat.key];

    let correct;
    if (valA === valB) {
      // Tie — either answer counts as correct
      correct = true;
    } else {
      correct = (side === 'A' && valA > valB) || (side === 'B' && valB > valA);
    }

    if (correct) {
      const newStreak = streak + 1;
      this.setState({
        streak:     newStreak,
        best:       Math.max(best, newStreak),
        phase:      'correct',
        chosenSide: side,
      });
      // Brief flash then chain: B becomes A
      setTimeout(() => this.startRound(monB, stat), 900);
    } else {
      this.setState({
        phase:      'wrong',
        chosenSide: side,
      });
      setTimeout(() => this.setState({ phase: 'gameover' }), 1000);
    }
  };

  handleRetry = () => {
    this.setState({ streak: 0, phase: 'playing', chosenSide: null });
    this.startRound(null, null);
  };

  render() {
    const { monA, monB, stat, loading, streak, best, phase, chosenSide } = this.state;

    if (loading || !monA || !monB || !stat) {
      return (
        <div className="challenge-page">
          <h1 className="page-title">Challenge</h1>
          <div className="challenge-loading">
            <div className="challenge-loading__ball" />
            <span>Loading…</span>
          </div>
        </div>
      );
    }

    const valA = monA.stats[stat.key];
    const valB = monB.stats[stat.key];
    const isTie = valA === valB;

    return (
      <div className="challenge-page">
        {phase === 'gameover' && (
          <GameOver streak={streak} best={best} onRetry={this.handleRetry} />
        )}

        {/* Header bar */}
        <div className="challenge-header">
          <h1 className="page-title" style={{ marginBottom: 0 }}>Challenge</h1>
          <div className="challenge-streak">
            <span className="challenge-streak__label">Streak</span>
            <span className={`challenge-streak__count${phase === 'correct' ? ' challenge-streak__count--bump' : ''}`}>
              {streak}
            </span>
          </div>
          {best > 0 && (
            <div className="challenge-streak challenge-streak--best">
              <span className="challenge-streak__label">Best</span>
              <span className="challenge-streak__count">{best}</span>
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="challenge-prompt">
          Which has the higher&nbsp;
          <span className="challenge-prompt__stat">{stat.label}</span>?
          {isTie && phase !== 'playing' && (
            <span className="challenge-prompt__tie"> (It's a tie!)</span>
          )}
        </div>

        {/* Cards */}
        <div className="challenge-arena">
          {[{ mon: monA, side: 'A' }, { mon: monB, side: 'B' }].map(({ mon, side }) => {
            const val = mon.stats[stat.key];
            const isChosen = chosenSide === side;
            const otherVal = side === 'A' ? valB : valA;
            const isWinner = val > otherVal || isTie;
            let cardState = '';
            if (phase === 'correct' || phase === 'wrong') {
              if (isChosen && isWinner) cardState = 'win';
              else if (isChosen && !isWinner) cardState = 'lose';
              else if (!isChosen && isWinner && phase === 'wrong') cardState = 'reveal';
            }

            return (
              <button
                key={side}
                className={`challenge-card challenge-card--${cardState || 'idle'}`}
                onClick={() => this.handleGuess(side)}
                disabled={phase !== 'playing'}
              >
                <div className="challenge-card__glow" />
                <img
                  src={mon.imgLink}
                  alt={mon.name}
                  className="challenge-card__img"
                />
                <p className="challenge-card__name">{mon.name}</p>

                {/* Reveal stat value after guess */}
                {(phase === 'correct' || phase === 'wrong') && (
                  <div className={`challenge-card__stat-reveal${cardState === 'win' || cardState === 'reveal' ? ' challenge-card__stat-reveal--winner' : ''}`}>
                    <span className="challenge-card__stat-label">{stat.label}</span>
                    <span className="challenge-card__stat-val">{val}</span>
                  </div>
                )}

                {cardState === 'win' && <span className="challenge-card__badge challenge-card__badge--win">✓</span>}
                {cardState === 'lose' && <span className="challenge-card__badge challenge-card__badge--lose">✗</span>}
              </button>
            );
          })}

          <div className="challenge-vs">VS</div>
        </div>
      </div>
    );
  }
}

export default Challenge;
