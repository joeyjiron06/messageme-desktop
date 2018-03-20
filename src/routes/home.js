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

  componentDidMount() {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log("what!this shouldnt happen, no user");
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
