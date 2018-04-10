import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import * as firebase from 'firebase';
import FirebaseStore from '../util/firebaseStore';
import './login.css';

export default class Login extends Component {
  componentDidMount() {
    this.authUnSubscriber = firebase.auth().onAuthStateChanged(user => {
      if (user) {
        FirebaseStore.init();
        console.log('logged in!', user);
        this.props.history.replace('/home');
      }
    });
  }

  componentWillUnmount() {
    this.authUnSubscriber();
  }

  login = () => {
    firebase
      .auth()
      .signInWithPopup(new firebase.auth.FacebookAuthProvider())
      .then(function(result) {
        console.log('logged in!', result);
      })
      .catch(error => {
        console.error('error logging in', error);
      });
  };

  render() {
    return (
      <div className="login-page">
        <h1>MessageMe</h1>
        <p className="login-page-welcome-message">Welcome! Please Sign in and unlock the magic!</p>
        <RaisedButton label="Sign In" primary={true} onClick={this.login} />
      </div>
    );
  }
}
