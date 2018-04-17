import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { withRouter } from 'react-router';
import { EVENTS } from '../../util/constants';
import './index.css';

class Login extends Component {
  componentDidMount() {
    this.props.store.subscribe(this.handleFirebseEvent);
  }

  componentWillUnmount() {
    this.props.store.unsubscribe(this.handleFirebseEvent);
  }

  handleFirebseEvent = event => {
    if (event.type === EVENTS.USER_CHANGED && event.user) {
      console.log('logged in!', event.user);
      this.props.history.replace('/home');
    }
  };

  login = () => {
    this.props.store.dispatch({
      type: EVENTS.LOGIN
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

export default withRouter(Login);
