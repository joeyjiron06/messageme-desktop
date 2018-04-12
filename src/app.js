import React, { Component } from 'react';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Login from './routes/login';
import Home from './routes/home';
import * as firebase from 'firebase';

function isLoggedIn() {
  return !!firebase.auth().currentUser;
}

console.log('public url', process.env.PUBLIC_URL);

export default class App extends Component {
  componentWillMount() {
    // if you are reading this code please don't use my firebase api config.
    // you can get your own config from here https://firebase.google.com/docs/web/setup
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
        <BrowserRouter basename={process.env.PUBLIC_URL}>
          <div>
            <Route exact path="/" render={() => <Redirect to="/login" />} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/home" render={() => (isLoggedIn() ? <Home /> : <Redirect to="/" />)} />
          </div>
        </BrowserRouter>
      </MuiThemeProvider>
    );
  }
}
