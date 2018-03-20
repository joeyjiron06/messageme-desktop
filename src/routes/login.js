import React, { Component } from "react";
import "./login.css";
import * as firebase from "firebase";

export default class Login extends Component {
  componentDidMount() {
    this.authUnSubscriber = firebase.auth().onAuthStateChanged(user => {
      if (user) {
        console.log("logged in!", user);
        this.props.history.replace("/home");
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
        console.log("logged in!", result);
      })
      .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error("error logging in", error);
      });
  };

  render() {
    return (
      <div className="login-page">
        <div>Login page!</div>
        <button onClick={this.login}>Log In</button>
      </div>
    );
  }
}
