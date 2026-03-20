import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';

class PokemonList extends React.Component {
  constructor(props) {
    super(props);

    const params = new URLSearchParams(props.location.search);

    this.counter = 0;

    this.state = {
      mons: [],
      region: params.get('region') || 'kanto',
      monName: '',
      listLink: '',
      monNum: 0,
      lastNum: 0,
      loading: true,
    };
  }

  componentDidMount() {
    this.getPokemonList();
  }

  clickedMon = (name) => {
    this.setState({ monName: name });
    const waitSecs = 120;
    setTimeout(() => {
      window.location.href = `/pokemon?name=${name}`;
    }, waitSecs);
  };

  getPokemonList = () => {
    const { region } = this.state;
    fetch(`https://pokeapi.co/api/v2/region/${region}`)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.getList(data.main_generation.url);
      })
      .catch((error) => console.log(error.message));
  };

  getList = (listLink) => {
    fetch(listLink)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.setState({ monNum: data.pokemon_species.length });
        const mon0 = data.pokemon_species[0].url;
        let startNum = mon0.substring(mon0.lastIndexOf('species') + 8, mon0.lastIndexOf('/')) - 1;
        this.counter = startNum;
        this.setState({ lastNum: startNum + data.pokemon_species.length + 1 });
        this.getList2(`https://pokeapi.co/api/v2/pokemon?limit=${this.state.monNum}&offset=${startNum}`);
      })
      .catch((error) => console.log(error.message));
  };

  getList2 = (listLink2) => {
    fetch(listLink2)
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.setState({ mons: data.results, loading: false });
      })
      .catch((error) => console.log(error.message));
  };

  getSprite = () => {
    if (this.counter === this.state.lastNum) {
      return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png';
    }
    this.counter++;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.counter}.png`;
  };

  topFunction = () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  render() {
    const { region, mons, loading } = this.state;

    return (
      <React.Fragment>
        <h1 className="page-title">{region}</h1>

        {loading ? (
          <div className="mon-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="mon-card skeleton" style={{ height: 130 }} />
            ))}
          </div>
        ) : (
          <div className="mon-grid">
            {mons.map((mon) => {
              const sprite = this.getSprite();
              return (
                <button
                  key={mon.name}
                  className="mon-card"
                  onClick={() => this.clickedMon(mon.name)}
                >
                  <img className="mon-card__sprite" src={sprite} alt={mon.name} />
                  <span className="mon-card__name">{mon.name}</span>
                </button>
              );
            })}
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
