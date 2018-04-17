import React, { Component } from 'react';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Login from './routes/login';
import Home from './routes/home';
import firebaseStore from './util/firebaseStore';
import { EVENTS } from './util/constants';

function isLoggedIn() {
  return !!firebaseStore.user;
}

export default class App extends Component {
  componentDidMount() {
    firebaseStore.dispatch({
      type: EVENTS.INIT
    });
  }
  render() {
    return (
      <MuiThemeProvider>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
          <div>
            <Route exact path="/" render={() => <Redirect to="/login" />} />
            <Route exact path="/login" render={() => <Login store={firebaseStore} />} />
            <Route
              exact
              path="/home"
              render={() => (isLoggedIn() ? <Home store={firebaseStore} /> : <Redirect to="/login" />)}
            />
          </div>
        </BrowserRouter>
      </MuiThemeProvider>
    );
  }
}
