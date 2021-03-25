import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';
import { Link } from 'react-router-dom';

class Pokemon extends React.Component {
    constructor(props) {
        super(props);

        const params = new URLSearchParams(props.location.search);

        this.state={
            name: params.get('name') || 'MissingNo.',
            imgLink: '',
        }
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
            //console.log(data.sprites.other["official-artwork"]["front_default"]);
            this.setState({ imgLink: data.sprites.other["official-artwork"]["front_default"] });
        })
        .catch(error => console.log(error.message));
    }

    render() {
        const{ name, imgLink } = this.state;

        return(
            <React.Fragment>
                <h1>{name}</h1>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <img className="w=100" src={imgLink} alt={name}></img>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default Pokemon;