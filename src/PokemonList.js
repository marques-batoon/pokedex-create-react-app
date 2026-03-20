import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';

// Extract national dex ID from a PokeAPI species URL
// e.g. "https://pokeapi.co/api/v2/pokemon-species/906/" -> 906
const extractId = (url) => parseInt(url.split('/').filter(Boolean).pop(), 10);

// Regions where main_generation is shared with another region (Hisui shares gen-viii
// with Galar), so we must use the named regional pokedex instead.
const FORCE_REGIONAL_POKEDEX = ['hisui'];

// Max legitimate national dex ID. Form-variant entries stored as species have IDs
// in the 10000+ range and don't correspond to real sprites — filter them out.
const MAX_SPECIES_ID = 10000;

class PokemonList extends React.Component {
  constructor(props) {
    super(props);

    const params = new URLSearchParams(props.location.search);

    this.state = {
      mons: [],
      region: params.get('region') || 'kanto',
      loading: true,
      error: false,
    };
  }

  componentDidMount() {
    this.getPokemonList();
  }

  clickedMon = (name) => {
    setTimeout(() => {
      window.location.href = `/pokemon?name=${name}`;
    }, 120);
  };

  getPokemonList = () => {
    const { region } = this.state;

    fetch(`https://pokeapi.co/api/v2/region/${region}`)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);

        const forcePokedex = FORCE_REGIONAL_POKEDEX.includes(region);

        if (!forcePokedex && data.main_generation) {
          // Standard path: pull species from the generation endpoint.
          this.getFromGeneration(data.main_generation.url);
        } else {
          // Fallback: use the regional pokedex.
          // Prefer a pokedex whose name matches the region (most specific),
          // then fall back to the first one in the list.
          const pokedexes = data.pokedexes || [];
          const regional =
            pokedexes.find((p) => p.name === region) || pokedexes[0];

          if (regional) {
            this.getFromPokedex(regional.url);
          } else {
            this.setState({ loading: false });
          }
        }
      })
      .catch((err) => {
        console.log(err.message);
        this.setState({ loading: false, error: true });
      });
  };

  // Pulls the generation's full species list, extracts IDs from URLs,
  // sorts by national dex number, and filters out form-variant entries (ID > 10000).
  // This correctly handles Paldea whose species aren't always returned in order.
  getFromGeneration = (url) => {
    fetch(url)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);

        const mons = data.pokemon_species
          .map((s) => ({ name: s.name, id: extractId(s.url) }))
          .filter((m) => m.id <= MAX_SPECIES_ID)
          .sort((a, b) => a.id - b.id);

        this.setState({ mons, loading: false });
      })
      .catch((err) => {
        console.log(err.message);
        this.setState({ loading: false, error: true });
      });
  };

  // Pulls from a regional pokedex endpoint (pokemon_entries in regional dex order).
  // Used for Hisui and any region without a usable main_generation.
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
            id: extractId(entry.pokemon_species.url),
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
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mon.id}.png`}
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
