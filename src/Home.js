import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';
import { Link } from 'react-router-dom';

// Emoji per region for visual flair
const regionEmoji = {
  kanto:  '🌸',
  johto:  '🍃',
  hoenn:  '🌊',
  sinnoh: '❄️',
  unova:  '🌆',
  kalos:  '🗼',
  alola:  '🌺',
  galar:  '⚔️',
  hisui:  '🏔️',
  paldea: '🍊',
};

class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      regions: [],
      regionClick: '',
    };
  }

  componentDidMount() {
    this.getRegionsData();
  }

  clickedRegion = (event) => {
    event.preventDefault();
    const val = event.currentTarget.dataset.value;
    this.setState({ regionClick: val });

    const waitSecs = 280;
    setTimeout(() => {
      window.location.href = `/pokemonlist?region=${val}`;
    }, waitSecs);
  };

  getRegionsData = () => {
    fetch('https://pokeapi.co/api/v2/region')
      .then(checkStatus)
      .then(json)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.setState({ regions: data.results });
      })
      .catch((error) => console.log(error.message));
  };

  render() {
    const { regions } = this.state;
    return (
      <React.Fragment>
        <h1 className="page-title">Choose a Region</h1>
        <div className="region-grid">
          {regions.map((region) => (
            <button
              key={region.name}
              className="region-card"
              data-value={region.name}
              onClick={this.clickedRegion}
            >
              <span className="region-card__pokeball">
                {regionEmoji[region.name] || '⭐'}
              </span>
              {region.name}
            </button>
          ))}
        </div>
      </React.Fragment>
    );
  }
}

export default Home;
