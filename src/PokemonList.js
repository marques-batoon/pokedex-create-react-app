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
          window.location.href=`/pokemon?mon=${event.target.value}`;
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
            console.log(data.main_generation.url);
            this.setState({ listLink: data.main_generation.url });
            this.getList();
        })
        .catch(error => console.log(error.message));
    }

    getList = () => {
        console.log(this.state.listLink);
        fetch(this.state.listLink)
        .then(checkStatus)
        .then(json)
        .then(data => {
            if(data.error) {
                throw new Error(data.error);
            }
            console.log(data.pokemon_species);
            this.setState({ mons: data.pokemon_species });
            
        })
    }

    render() {
        const{ region, monName, mons } = this.state;

        return(
            <React.Fragment>
                <h1>{region}</h1>
                <div className="list-group">
                {mons.map(mon => <Link to={`/pokemon?name=${monName}`}key={mon.name}><button type="button" className="list-group-item list-group-item-action text-center" value={mon.name} onClick={this.clickedMon}>{mon.name}</button></Link>)}
                </div>
            </React.Fragment>
        )
    }
}

export default PokemonList;
