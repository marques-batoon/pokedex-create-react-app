import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';

class Home extends React.Component {
    constructor() {
        super();
        this.state={
            regions: [],
        }
    }

    componentDidMount() {
        this.getRegionsData();
    }

    getRegionsData = () => {
        fetch(`https://pokeapi.co/api/v2/region`)
        .then(checkStatus)
        .then(json)
        .then(data => {
            if(data.error) {
                throw new Error(data.error);
            }
            const regions = data.results;
            this.setState({ regions });
            console.log(regions[0].name);
        })
        .catch(error => console.log(error.message));
    }

    render() {
        const{ regions } = this.state;
        return(
            <React.Fragment>
                <ul className="list-group">
                    {regions.map(region => <li key={region.name} className="list-group-item text-center">{region.name}</li>)}
                </ul>
            </React.Fragment>
        )
    }
}

export default Home;
