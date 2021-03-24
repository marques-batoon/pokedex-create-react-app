import React from 'react';
import { checkStatus, json } from './utils/fetchUtils';
import { Link } from 'react-router-dom';

class Home extends React.Component {
    constructor() {
        super();
        this.state={
            regions: [],
            regionClick: "",
        }
    }

    componentDidMount() {
        this.getRegionsData();
    }

    clickedRegion = (event) => {
        event.preventDefault();
        this.setState({ regionClick: event.target.value });

        const waitSecs = 250 // 0.25 seconds
        setTimeout(() => {
          window.location.href=`/pokemonlist?region=${event.target.value}`;
        },waitSecs);
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
            //console.log(regions[0].name);
        })
        .catch(error => console.log(error.message));
    }

    render() {
        const{ regions, regionClick } = this.state;
        return(
            <React.Fragment>
                <div className="list-group">
                    {regions.map(region => <Link to={`/pokemonlist?region=${regionClick}`}key={region.name}><button type="button" className="list-group-item list-group-item-action text-center" value={region.name} onClick={this.clickedRegion}>{region.name}</button></Link>)}

                </div>
            </React.Fragment>
        )
    }
}

export default Home;
