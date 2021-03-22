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
