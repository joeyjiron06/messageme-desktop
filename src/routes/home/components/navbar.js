import React, { Component } from 'react';
import { EVENTS } from '../../../util/constants';
import packageJson from '../../../package.alias.json';
import { green400, grey300 } from 'material-ui/styles/colors';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';

import './navbar.css';

export default class NavBar extends Component {
  state = {
    phoneOnline: false,
    isMenuOpen: false,
    menuAnchorElement: null,
    isAboutModalOpen: false
  };

  componentDidMount() {
    this.setState({
      user: this.props.store.user
    });
    this.props.store.subscribe(this.handleFirebaseEvent);
  }

  componentWillUnmount() {
    this.props.store.unsubscribe(this.handleFirebaseEvent);
  }

  handleFirebaseEvent = event => {
    switch (event.type) {
      case EVENTS.USER_CHANGED:
        this.setState({ user: event.user });
        break;
      case EVENTS.PHONE_STATUS_CHANGED:
        this.setState({
          phoneOnline: event.phoneOnline
        });
        break;
      default:
        break;
    }
  };

  openMenu = event => {
    // This prevents ghost click.
    event.preventDefault();
    this.setState({
      isMenuOpen: true,
      menuAnchorElement: event.currentTarget
    });
  };

  closeMenu = event => {
    this.setState({
      isMenuOpen: false
    });
  };

  signOut = event => {
    this.props.history.replace('/');
    this.props.store.dispatch({
      type: EVENTS.LOGOUT
    });
  };

  openAboutDialog = event => {
    this.setState({
      isAboutModalOpen: true,
      isMenuOpen: false
    });
  };

  closeAboutDialog = event => {
    this.setState({ isAboutModalOpen: false });
  };

  render() {
    const { phoneOnline, user, isMenuOpen, menuAnchorElement, isAboutModalOpen } = this.state;

    return (
      <div className="nav-bar">
        <h1 className="nav-bar-title">MessageMe</h1>

        <div className="nav-bar-right-side">
          <IconButton
            iconClassName="material-icons"
            tooltip={phoneOnline ? 'Phone Online' : 'Phone Offline'}
            iconStyle={{
              color: phoneOnline ? green400 : grey300
            }}
          >
            phone_android
          </IconButton>
          {user ? <img className="nav-bar-user-icon" src={user.photoURL} alt="user" onClick={this.openMenu} /> : null}

          <Popover
            open={isMenuOpen}
            anchorEl={menuAnchorElement}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            targetOrigin={{ horizontal: 'right', vertical: 'top' }}
            onRequestClose={this.closeMenu}
          >
            <Menu>
              <MenuItem primaryText={user ? user.displayName : null} />
              <Divider />
              <MenuItem primaryText="About" onClick={this.openAboutDialog} />
              <MenuItem primaryText="Settings" />
              <Divider />
              <MenuItem primaryText="Sign out" onClick={this.signOut} />
            </Menu>
          </Popover>

          <Dialog
            title="About"
            actions={[<FlatButton label="Ok" primary={true} onClick={this.closeAboutDialog} />]}
            modal={false} // setting false enables 'ESC' key to close dialog
            open={isAboutModalOpen}
            onRequestClose={this.closeAboutDialog}
          >
            <p>Version : {packageJson.version}</p>
            <br />
            <p>
              This is a messaging app that allows you to send sms from your computer. The way it works is by sending a
              message to your android phone which then sends the sms message. Make sure to install the Android app in
              order to get it to work!
            </p>
          </Dialog>
        </div>
      </div>
    );
  }
}
