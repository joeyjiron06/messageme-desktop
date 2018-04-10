import React, { Component } from 'react';
import FirebaseStore, { EVENTS } from '../util/firebaseStore';
import Smartphone from 'material-ui/svg-icons/hardware/phone-android';
import { green400, grey300 } from 'material-ui/styles/colors';
import './navbar.css';

export default class NavBar extends Component {
  state = {
    phoneOnline: false
  };
  componentDidMount() {
    FirebaseStore.addListener(this.handleFirebaseEvent);
  }

  handleFirebaseEvent = event => {
    switch (event.type) {
      case EVENTS.PHONE_STATUS_CHANGED:
        this.setState({
          phoneOnline: event.phoneOnline
        });
        break;
      default:
        break;
    }
  };

  render() {
    const { phoneOnline } = this.state;

    return (
      <div className="nav-bar">
        <h1 className="nav-bar-title">MessageMe</h1>

        <Smartphone color={phoneOnline ? green400 : grey300} />
      </div>
    );
  }
}
