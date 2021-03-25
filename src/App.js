import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Layout from './Layout';
import Home from './Home';
import PokemonList from './PokemonList';

import './App.css';
import Pokemon from './Pokemon';

const App = () => {
  return(
    <Router>
      <Layout>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/pokemonlist" component={PokemonList} />
          <Route path="/pokemon" component={Pokemon} />
          <Route render={() => <h1>404 Not Found</h1>} />
        </Switch>
      </Layout>
    </Router>
  );
}

export default App;
