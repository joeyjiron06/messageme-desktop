import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as firebase from "firebase";
import Avatar from "material-ui/Avatar";
import { List, ListItem } from "material-ui/List";
import Subheader from "material-ui/Subheader";
import Divider from "material-ui/Divider";
import CommunicationChatBubble from "material-ui/svg-icons/communication/chat-bubble";
import "./home.css";

const LOCAL_MESSAGE_STATUS = {
  REQUESTING: 1,
  SENDING: 2,
  SENT: 3,
  ERROR: 4
};

// https://yalantis.com/blog/what-i-learned-building-smsmms-messenger-for-android/
export default class Home extends Component {
  state = {};

  onKeyPress = event => {
    if (event.key === "Enter") {
      const text = event.target.value;

      this.outboxDB.push({
        address: this.currentConversation.address,
        date: Date.now(),
        status: LOCAL_MESSAGE_STATUS.REQUESTING,
        conversationId: this.currentConversation.id,
        text
      });
      console.log("on enter!", text);
      event.target.value = null;
    }
  };

  contactsChanged = snapshot => {
    const contacts = snapshot.val() || [];
    const contactNames = {};
    contacts.forEach(contact => {
      contactNames[contact.number] = contact.displayName;
    });

    this.setState({
      contactNames
    });
  };

  conversationsChanged = snapshot => {
    const conversations = snapshot.val() || [];
    console.log("conversations", conversations);
    this.setState({ conversations });
  };

  messagesChanged = snapshot => {
    let messages = snapshot.val() || [];
    console.log("messages changed", messages);

    this.setState({ messages }, () => {
      const messagesContainer = ReactDOM.findDOMNode(this.messagesContainer);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

    this.contactsDB = firebase
      .database()
      .ref("contacts")
      .child(user.uid);

    this.outboxDB = firebase
      .database()
      .ref("outbox")
      .child(user.uid);

    this.contactsDB.on("value", this.contactsChanged);

    this.conversationsDB.on("value", this.conversationsChanged);
  }

  conversationClicked(conversation, index) {
    console.log("conversation clicked", conversation);

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
    const contactNames = this.state.contactNames || [];
    const messages = this.state.messages || [];
    const selectedIndex = this.state.selectedIndex;

    return (
      <div className="home-page">
        <List className="home-convo-list">
          {conversations.map((conversation, index) => (
            <ListItem
              key={conversation.address}
              primaryText={conversation.address
                .split(",")
                .map(number => contactNames[number] || number)
                .join(", ")}
              secondaryText={conversation.body}
              secondaryTextLines={1}
              onClick={this.conversationClicked.bind(this, conversation, index)}
              style={{
                backgroundColor: selectedIndex === index ? "#efefef" : null
              }}
            />
          ))}
        </List>

        <div className="home-right-side">
          <div
            className="home-message-list"
            style={{ padding: 20 }}
            ref={el => {
              this.messagesContainer = el;
            }}
          >
            {messages.map(message => (
              <div
                key={message.id}
                className={`message ${
                  message.status === 2 ? "message-sent" : "message-received"
                }`}
                onClick={() => {
                  console.log("message clicked", message);
                }}
              >
                {message.type === "MMS" && !message.body
                  ? "IMAGE"
                  : message.body}
              </div>
            ))}
          </div>

          <div className="home-input-container">
            <input
              type="text"
              placeholder="Type a message..."
              className="home-input"
              onKeyPress={this.onKeyPress}
            />
          </div>
        </div>
      </div>
    );
  }
}
