import React from 'react';
import Chart from 'chart.js';
import { checkStatus, json } from './utils/fetchUtils';
import { Link } from 'react-router-dom';

class Pokemon extends React.Component {
    constructor(props) {
        super(props);

        const params = new URLSearchParams(props.location.search);

        this.state={
            name: params.get('name') || 'MissingNo.',
            pokeNum: '',
            imgLink: '',
            nextMon: '',
            prevMon: '',
            disabled: true,
        }
        this.chartRef = React.createRef();
    }

    componentDidMount() {
        this.getMon();
    }

    getMon = () => {
        fetch(`https://pokeapi.co/api/v2/pokemon/${this.state.name}`)
        .then(checkStatus)
        .then(json)
        .then(data => {
            if(data.error) {
                throw new Error(data.error);
            }
            // artwork
            this.setState({ imgLink: data.sprites.other["official-artwork"]["front_default"] });

            // stats for chart
            this.buildChart(["HP", "ATK", "DEF", "SpATK", "SpDEF", "SPD"], [data.stats[0].base_stat, data.stats[1].base_stat, data.stats[2].base_stat, data.stats[3].base_stat, data.stats[4].base_stat, data.stats[5].base_stat], "Base Stats");

            // pokeNum
            const mon0 = data.species.url;
            const pokeNum = mon0.substring(mon0.lastIndexOf("species") + 8, mon0.lastIndexOf("/"));
            this.setState({ pokeNum });
            this.toNext(1 + parseInt(pokeNum));
            this.toPrev(parseInt(pokeNum) - 1);

            // next and prev button
            this.setState({ disabled: false });

        })
        .catch(error => console.log(error.message));
    }

    toNext = (num) => {
        fetch(`https://pokeapi.co/api/v2/pokemon/${num}`)
        .then(checkStatus)
        .then(json)
        .then(data => {
            if(data.error) {
                this.setState({ nextMon: this.state.name });
                throw new Error(data.error);
            }
            this.setState({ nextMon: data.name });
        })
        .catch(error => console.log(error.message));
    }

    toPrev = (num) => {
        if(num===0){
            num = 1;
        }
        fetch(`https://pokeapi.co/api/v2/pokemon/${num}`)
        .then(checkStatus)
        .then(json)
        .then(data => {
            if(data.error) {
                throw new Error(data.error);
            }
            this.setState({ prevMon: data.name });
        })
        .catch(error => console.log(error.message));
    }

    buildChart = (labels, data, label) => {
        const chartRef = this.chartRef.current.getContext("2d");

        if(typeof this.chart !== "undefined") {
            this.chart.destroy();
        }

        this.chart = new Chart(this.chartRef.current.getContext("2d"), {
            type: 'horizontalBar',
            data: {
                labels,
                datasets: [
                    {
                        label: label,
                        data,
                        backgroundColor: ['rgba(255, 0, 0, 0.3)', 'rgba(240, 128, 48, 0.3)', 'rgba(248, 208, 48, 0.3)','rgba(104, 144, 240, 0.3)', 'rgba(120, 200, 80, 0.3)', 'rgba(248, 88, 136, 0.3)'],
                        hoverBackgroundColor: ['rgb(255, 0, 0)', 'rgb(240, 128, 48)', 'rgb(248, 208, 48)','rgb(104, 144, 240)', 'rgb(120, 200, 80)', 'rgb(248, 88, 136)'],
                    }
                ]
            },
            options: {
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true,
                            max: 250,
                        }
                    }]
                }
            }
        });
    }    

    nextPokemon = () => {
        const waitSecs = 100 // 0.1 seconds
        setTimeout(() => {
          window.location.href=`/pokemon?name=${this.state.nextMon}`;
        },waitSecs);
    }

    prevPokemon = () => {
        const waitSecs = 100 // 0.1 seconds
        setTimeout(() => {
          window.location.href=`/pokemon?name=${this.state.prevMon}`;
        },waitSecs);
    }

    render() {
        const{ name, imgLink, disabled } = this.state;

        return(
            <React.Fragment>
                <div className="container">
                    <div className="row justify-content-between">
                        <button onClick={this.prevPokemon} disabled={disabled}>Prev</button>
                        <button onClick={this.nextPokemon} disabled={disabled}>Next</button>
                    </div>
                </div>
                <h1>{name}</h1>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12 row justify-content-center">
                            <img className="mon100" src={imgLink} alt={name}></img>
                        </div>
                        <div className="col-12 col-lg-6">
                            <canvas ref={this.chartRef} />
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default Pokemon;