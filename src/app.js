import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';
import Login from './routes/login';
import Home from './routes/home';
import * as firebase from 'firebase';

function isLoggedIn() {
  return !!firebase.auth().currentUser;
}

export default class App extends Component {
  requireAuth = (nextState, replace) => {
    if (!firebase.auth().currentUser) {
      console.log('no user exists!');
      replace({
        pathname: '/'
      });
    } else {
      console.log('user exists!');
    }
  };

  componentWillMount() {
    firebase.initializeApp({
      apiKey: 'AIzaSyABLDsce39YrbqSL2od0xdgYUHvvMdK7d0',
      authDomain: 'messageme-644c5.firebaseapp.com',
      databaseURL: 'https://messageme-644c5.firebaseio.com',
      projectId: 'messageme-644c5',
      storageBucket: 'messageme-644c5.appspot.com',
      messagingSenderId: '809721868493'
    });
  }

  render() {
    return (
      <MuiThemeProvider>
        <BrowserRouter ref={this.onRouterRef}>
          <div>
            <Route exact path="/" render={() => <Redirect to="/login" />} />
            <Route exact path="/login" component={Login} />
            <Route
              exact
              path="/home"
              render={() => (isLoggedIn() ? <Home /> : <Redirect to="/" />)}
            />
          </div>
        </BrowserRouter>
      </MuiThemeProvider>
    );
  }
}
