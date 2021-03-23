import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';

class PokemonList extends React.Component {
    constructor(props) {
        super(props);

        const params = new URLSearchParams(props.location.search);

        console.log(params.get('region'));

        this.state={
            mons: [],
            region: params.get('region') || 'kanto',
        }
    }

    componentDidMount() {
        this.getPokemonList();
    }

    getPokemonList = () => {
        const{ region } = this.state;
        console.log("LIST!");
        fetch(`https://pokeapi.co/api/v2/region/${region}`)
        .then(checkStatus)
        .then(json)
        .then(data => {
            if(data.error) {
                throw new Error(data.error);
            }
            console.log(data.main_generation.url);
        })
        .catch(error => console.log(error.message));
    }

    render() {
        const{ region } = this.state;

        return(
            <React.Fragment>
                <h1>{region}</h1>
            </React.Fragment>
        )
    }
}

export default PokemonList;
