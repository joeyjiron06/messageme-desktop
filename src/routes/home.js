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

  conversationsChanged = snapshot => {
    const conversations = snapshot.val() || [];
    this.setState({
      conversations
    });
  };

  messagesChanged = snapshot => {
    let messages = snapshot.val() || [];
    messages = messages.reverse().slice(-20);
    this.setState({ messages }, () => {
      const messageListElement = document.getElementsByClassName(
        "home-message-list"
      );
      messageListElement.scrollTop = messageListElement.scrollHeight;
    });
  };

  componentDidMount() {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log("what!this shouldnt happen, no user");
      return;
    }

    this.conversationsDB = firebase
      .database()
      .ref("conversations")
      .child(user.uid);

    this.messagesDB = firebase
      .database()
      .ref("messages")
      .child(user.uid);

    this.conversationsDB.on("value", this.conversationsChanged);
  }

  conversationClicked(conversation, index) {
    if (this.currentConversation) {
      this.removeMessageListener(this.currentConversation);
    }

    this.currentConversation = conversation;
    this.addMessageListener(conversation);
    this.setState({
      selectedIndex: index
    });
  }

  addMessageListener(conversation) {
    this.messagesDB.child(conversation.id).on("value", this.messagesChanged);
  }

  removeMessageListener(conversation) {
    this.messagesDB.child(conversation.id).off("value", this.messagesChanged);
  }

  render() {
    const conversations = this.state.conversations || [];
    const messages = this.state.messages || [];
    const selectedIndex = this.state.selectedIndex;

    return (
      <div className="home-page">
        <List className="home-convo-list">
          {conversations.map((conversation, index) => (
            <ListItem
              key={conversation.address}
              primaryText={conversation.address}
              secondaryText={conversation.body}
              secondaryTextLines={1}
              onClick={this.conversationClicked.bind(this, conversation, index)}
              style={{
                backgroundColor: selectedIndex === index ? "#efefef" : null
              }}
            />
          ))}
        </List>

        <List className="home-message-list" style={{ padding: 20 }}>
          {messages.map(message => (
            <div
              key={message.id}
              className={`message ${
                message.type === 2 ? "message-sent" : "message-received"
              }`}
            >
              {message.body}
            </div>
          ))}
        </List>
      </div>
    );
  }
}
