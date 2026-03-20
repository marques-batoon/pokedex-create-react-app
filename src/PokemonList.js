import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';

const extractId = (url) => parseInt(url.split('/').filter(Boolean).pop(), 10);

// Hisui has no main_generation of its own so must use the regional pokédex.
// All other regions use getFromGeneration (new species only).
const FORCE_REGIONAL_POKEDEX = new Set(['hisui']);

// For regions with regional forms, these are the BASE species names that have
// a regional variant. We fetch only these specific form names — NOT the full
// regional dex. Promise.allSettled means a missing form quietly drops out.
const REGIONAL_FORM_BASES = {
  alola: [
    'rattata-alola', 'raticate-alola', 'raichu-alola', 'sandshrew-alola', 'sandslash-alola',
    'vulpix-alola', 'ninetales-alola', 'diglett-alola', 'dugtrio-alola', 'meowth-alola', 'persian-alola',
    'geodude-alola', 'graveler-alola', 'golem-alola', 'grimer-alola', 'muk-alola',
    'exeggutor-alola', 'marowak-alola',
  ],
  galar: [
    'meowth-galar', 'ponyta-galar', 'rapidash-galar', 'slowpoke-galar', 'slowbro-galar', 'slowking-galar',
    'farfetchd-galar', 'weezing-galar', 'mr-mime-galar', 'corsola-galar', 'zigzagoon-galar', 'linoone-galar',
    'darumaka-galar', 'darmanitan-galar-standard', 'yamask-galar', 'stunfisk-galar',
    'articuno-galar', 'zapdos-galar', 'moltres-galar',
  ],
  paldea: [
    'wooper-paldea',
    'tauros-paldea-combat-breed',
    'tauros-paldea-blaze-breed',
    'tauros-paldea-aqua-breed',
  ],
};

// Pass ?region= hint when navigating to these regions so Pokemon.js can
// auto-resolve base-species clicks to the correct regional form.
const REGIONAL_FORM_REGIONS = new Set(['alola', 'galar', 'hisui', 'paldea']);

const MAX_SPECIES_ID = 10000;

class PokemonList extends React.Component {
  constructor(props) {
    super(props);
    const params = new URLSearchParams(props.location.search);
    this.state = {
      mons:    [],
      region:  params.get('region') || 'kanto',
      loading: true,
      error:   false,
    };
  }

  componentDidMount() {
    this.getPokemonList();
  }

  clickedMon = (name) => {
    const { region } = this.state;
    // If the name already has the regional suffix baked in (e.g. 'vulpix-alola'),
    // navigate directly — no region hint needed and avoids double-suffix bugs.
    const alreadyForm = REGIONAL_FORM_REGIONS.has(region) && name.includes(`-${region}`);
    const regionParam = (!alreadyForm && REGIONAL_FORM_REGIONS.has(region)) ? `&region=${region}` : '';
    setTimeout(() => {
      window.location.href = `/pokemon?name=${name}${regionParam}`;
    }, 120);
  };

  getPokemonList = () => {
    const { region } = this.state;
    fetch(`https://pokeapi.co/api/v2/region/${region}`)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);

        if (FORCE_REGIONAL_POKEDEX.has(region)) {
          // Hisui: use the named regional pokédex (only path that works)
          const pokedexes = data.pokedexes || [];
          const regional = pokedexes.find((p) => p.name === region) || pokedexes[0];
          if (regional) {
            this.getFromPokedex(regional.url);
          } else {
            this.setState({ loading: false });
          }
        } else {
          // All other regions: new species from the generation endpoint
          // + any hardcoded regional forms for this region
          this.getFromGeneration(data.main_generation.url);
        }
      })
      .catch((err) => {
        console.log(err.message);
        this.setState({ loading: false, error: true });
      });
  };

  // Fetches new species introduced in this generation, then appends any
  // regional forms defined in REGIONAL_FORM_BASES for this region.
  getFromGeneration = (url) => {
    const { region } = this.state;

    fetch(url)
      .then(checkStatus)
      .then(json)
      .then(async (data) => {
        if (data.error) throw new Error(data.error);

        const genMons = data.pokemon_species
          .map((s) => ({ name: s.name, id: extractId(s.url) }))
          .filter((m) => m.id <= MAX_SPECIES_ID)
          .sort((a, b) => a.id - b.id);

        // Fetch regional forms in parallel — failures silently drop out
        const formBases = REGIONAL_FORM_BASES[region] || [];
        const formResults = await Promise.allSettled(
          formBases.map((formName) =>
            fetch(`https://pokeapi.co/api/v2/pokemon/${formName}`)
              .then(checkStatus)
              .then(json)
              .then((d) => ({ name: d.name, id: d.id, sprite: d.sprites.front_default }))
          )
        );

        const regionalForms = formResults
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);

        // Merge: gen species first, then regional forms appended at the end
        this.setState({ mons: [...genMons, ...regionalForms], loading: false });
      })
      .catch((err) => {
        console.log(err.message);
        this.setState({ loading: false, error: true });
      });
  };

  // Used only for Hisui — pulls from the regional pokédex endpoint.
  getFromPokedex = (url) => {
    fetch(url)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const mons = [...(data.pokemon_entries || [])]
          .sort((a, b) => a.entry_number - b.entry_number)
          .map((entry) => ({
            name: entry.pokemon_species.name,
            id:   extractId(entry.pokemon_species.url),
          }))
          .filter((m) => m.id <= MAX_SPECIES_ID);
        this.setState({ mons, loading: false });
      })
      .catch((err) => {
        console.log(err.message);
        this.setState({ loading: false, error: true });
      });
  };

  topFunction = () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  render() {
    const { region, mons, loading, error } = this.state;
    return (
      <React.Fragment>
        <h1 className="page-title">{region}</h1>

        {loading && (
          <div className="mon-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="mon-card skeleton" style={{ height: 130 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>
            Could not load Pokémon for this region. Try again later.
          </p>
        )}

        {!loading && !error && (
          <div className="mon-grid">
            {mons.map((mon) => (
              <button
                key={mon.name}
                className="mon-card"
                onClick={() => this.clickedMon(mon.name)}
              >
                <img
                  className="mon-card__sprite"
                  src={mon.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mon.id}.png`}
                  alt={mon.name}
                />
                <span className="mon-card__name">{mon.name}</span>
              </button>
            ))}
          </div>
        )}

        <button className="btn-top" onClick={this.topFunction} title="Back to top">
          ↑
        </button>
      </React.Fragment>
    );
  }
}

export default PokemonList;
