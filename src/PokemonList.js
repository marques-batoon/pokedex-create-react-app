import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';
import { Link } from 'react-router-dom';

class PokemonList extends React.Component {
    constructor(props) {
        super(props);

        const params = new URLSearchParams(props.location.search);

        //console.log(params.get('region'));

        this.state={
            mons: [],
            region: params.get('region') || 'kanto',
            monName: '',
            listLink: '',
            listLink2: '',
            monNum: 0,
        }
    }

    componentDidMount() {
        this.getPokemonList();
    }

    clickedMon = (event) => {
        event.preventDefault();
        this.setState({ monName: event.target.value });

        const waitSecs = 250 // 0.25 seconds
        setTimeout(() => {
          window.location.href=`/pokemon?name=${event.target.value}`;
        },waitSecs);
    }

    getPokemonList = () => {
        const{ region } = this.state;
        fetch(`https://pokeapi.co/api/v2/region/${region}`)
        .then(checkStatus)
        .then(json)
        .then(data => {
            if(data.error) {
                throw new Error(data.error);
            }
            this.setState({ listLink: data.main_generation.url });
            this.getList();
        })
        .catch(error => console.log(error.message));
    }

    getList = () => {
        fetch(this.state.listLink)
        .then(checkStatus)
        .then(json)
        .then(data => {
            if(data.error) {
                throw new Error(data.error);
            }
            this.setState({ monNum: data.pokemon_species.length });
            const mon0 = data.pokemon_species[0].url;
            let startNum = mon0.substring(mon0.lastIndexOf("species") + 8, mon0.lastIndexOf("/")) - 1;
            this.setState({ listLink2: `https://pokeapi.co/api/v2/pokemon?limit=${this.state.monNum}&offset=${startNum}` });
            this.getList2();
        })
        .catch(error => console.log(error.message));
    }

    getList2 = () => {
        fetch(this.state.listLink2)
        .then(checkStatus)
        .then(json)
        .then(data => {
            if(data.error) {
                throw new Error(data.error);
            }
            this.setState({ mons: data.results });
        })
        .catch(error => console.log(error.message));
    }

    getSprite = (namae) => {
        fetch(`https://pokeapi.co/api/v2/pokemon/${namae}`)
        .then(checkStatus)
        .then(json)
        .then(data => {
            if(data.error) {
                throw new Error(data.error);
            }
            console.log(data.sprites["front_default"]);
            return data.sprites["front_default"];
        })
        .catch(error => console.log(error.message));
    }

    topFunction = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    render() {
        const{ region, monName, mons } = this.state;

        return(
            <React.Fragment>
                <h1>{region}</h1>
                <div className="list-group">
                    {mons.map(mon => <button type="button" className="list-group-item list-group-item-action text-center" key={mon.name} value={mon.name} onClick={this.clickedMon}>{mon.name}</button>
                    )}
                </div>
                <button onClick={this.topFunction}>Top</button>
            </React.Fragment>
        )
    }
}

export default PokemonList;
