import React from 'react';
import Chart from 'chart.js';
import { checkStatus, json } from './utils/fetchUtils';

class Pokemon extends React.Component {
  constructor(props) {
    super(props);

    const params = new URLSearchParams(props.location.search);

    this.state = {
      name: params.get('name') || 'MissingNo.',
      pokeNum: '',
      imgLink: '',
      nextMon: '',
      prevMon: '',
      disabled: true,
      nextDisabled: true,
    };
    this.chartRef = React.createRef();
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

        this.setState({ imgLink: data.sprites.other['official-artwork']['front_default'] });

        this.buildChart(
          ['HP', 'ATK', 'DEF', 'Sp.ATK', 'Sp.DEF', 'SPD'],
          [
            data.stats[0].base_stat,
            data.stats[1].base_stat,
            data.stats[2].base_stat,
            data.stats[3].base_stat,
            data.stats[4].base_stat,
            data.stats[5].base_stat,
          ],
          'Base Stats'
        );

        const mon0 = data.species.url;
        const pokeNum = mon0.substring(mon0.lastIndexOf('species') + 8, mon0.lastIndexOf('/'));
        this.setState({ pokeNum });
        this.toNext(1 + parseInt(pokeNum));
        this.toPrev(parseInt(pokeNum) - 1);
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

  buildChart = (labels, data, label) => {
    if (typeof this.chart !== 'undefined') {
      this.chart.destroy();
    }

    this.chart = new Chart(this.chartRef.current.getContext('2d'), {
      type: 'horizontalBar',
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            backgroundColor: [
              'rgba(255, 50, 50, 0.25)',
              'rgba(240, 128, 48, 0.25)',
              'rgba(248, 208, 48, 0.25)',
              'rgba(104, 144, 240, 0.25)',
              'rgba(120, 200, 80, 0.25)',
              'rgba(248, 88, 136, 0.25)',
            ],
            hoverBackgroundColor: [
              'rgba(255, 50, 50, 0.7)',
              'rgba(240, 128, 48, 0.7)',
              'rgba(248, 208, 48, 0.7)',
              'rgba(104, 144, 240, 0.7)',
              'rgba(120, 200, 80, 0.7)',
              'rgba(248, 88, 136, 0.7)',
            ],
            borderColor: [
              'rgb(255, 50, 50)',
              'rgb(240, 128, 48)',
              'rgb(248, 208, 48)',
              'rgb(104, 144, 240)',
              'rgb(120, 200, 80)',
              'rgb(248, 88, 136)',
            ],
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        legend: { display: false },
        scales: {
          xAxes: [
            {
              ticks: {
                beginAtZero: true,
                max: 255,
                fontColor: '#7a7a9a',
                fontSize: 11,
              },
              gridLines: {
                color: 'rgba(255,255,255,0.05)',
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                fontColor: '#f0f0f0',
                fontSize: 12,
                fontStyle: 'bold',
              },
              gridLines: {
                color: 'rgba(255,255,255,0.05)',
              },
            },
          ],
        },
      },
    });
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
    const { name, imgLink, disabled, nextDisabled } = this.state;

    return (
      <div className="pokemon-detail">
        <div className="pokemon-detail__nav">
          <button
            className="btn-nav btn-nav--prev"
            onClick={this.prevPokemon}
            disabled={disabled}
          >
            ← Prev
          </button>
          <button
            className="btn-nav btn-nav--next"
            onClick={this.nextPokemon}
            disabled={nextDisabled}
          >
            Next →
          </button>
        </div>

        <h1 className="pokemon-detail__name">{name}</h1>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-5 pokemon-detail__image-wrap">
              {imgLink && (
                <img className="mon100" src={imgLink} alt={name} />
              )}
            </div>
            <div className="col-12 col-md-7">
              <div className="pokemon-detail__chart-wrap">
                <canvas ref={this.chartRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Pokemon;
