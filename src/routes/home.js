import React, { Component } from "react";
import * as firebase from "firebase";
import Avatar from "material-ui/Avatar";
import { List, ListItem } from "material-ui/List";
import Subheader from "material-ui/Subheader";
import Divider from "material-ui/Divider";
import CommunicationChatBubble from "material-ui/svg-icons/communication/chat-bubble";
import "./home.css";

export default class Home extends Component {
  state = {};

  onAuthStateChanged = user => {
    if (!user) {
      this.props.navigate.replace("/");
      return;
    }

    // ignore refresh tokens
    if (user && this.currentUId === user.uid) {
      return;
    }

    firebase
      .database()
      .ref("users")
      .child(user.uid)
      .child("conversations")
      .once("value")
      .then(snapshot => {
        const conversations = snapshot.val();
        this.setState({
          conversations
        });
      });
  };

  componentDidMount() {
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged);
  }

  render() {
    const conversations = this.state.conversations || [];

    return (
      <div className="home-page">
        <List className="home-convo-list">
          {conversations.map(conversation => (
            <ListItem
              key={conversation.address}
              primaryText={conversation.address}
              secondaryText={conversation.body}
              secondaryTextLines={1}
            />
          ))}
        </List>
      </div>
    );
  }
}
