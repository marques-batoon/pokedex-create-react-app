import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Layout from './Layout';
import Home from './Home';
import PokemonList from './PokemonList';

import './App.css';

const App = () => {
  return(
    <Router>
      <Layout>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/pokemonlist" component={PokemonList} />
          <Route path="/pokemon" render={() => <h1>Pokemon</h1>} />
          <Route render={() => <h1>404 Not Found</h1>} />
        </Switch>
      </Layout>
    </Router>
  );
}

export default App;
