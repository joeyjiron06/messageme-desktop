import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as firebase from "firebase";
import Avatar from "material-ui/Avatar";
import { List, ListItem } from "material-ui/List";
import Subheader from "material-ui/Subheader";
import Divider from "material-ui/Divider";
import CommunicationChatBubble from "material-ui/svg-icons/communication/chat-bubble";
import "./home.css";

const MESSAGE_STATUS = {
  RECEIVED: 1,
  SENT: 2
};

// https://yalantis.com/blog/what-i-learned-building-smsmms-messenger-for-android/
export default class Home extends Component {
  state = {
    messages: [], // the messages the phone has sent
    outboxMessages: [], // the messages this app has requested to be sent
    sentMessages: {}, // a hash { phoneMessageId : desktopMessageId }
    conversations: [], // phones list of conversations
    contactNames: {}, // a hash { phoneNumber : name }
    selectedIndex: -1 // the index of the selected conversation
  };

  onKeyPress = event => {
    if (event.key === "Enter") {
      const body = event.target.value;
      if (!body) {
        return;
      }

      if (!this.currentConversation) {
        return;
      }

      // create message
      const outboxMessage = this.createMessage(body);

      // add to firebase, this will trigget a outbox change event
      // @see
      this.outboxDB.push(outboxMessage);

      // // update UI
      const outboxMessages = [...this.state.outboxMessages, outboxMessage];

      this.setState(
        {
          messages: this.joinMessages(this.state.messages, outboxMessages)
        },
        () => {
          this.scrollToBottom();
        }
      );

      // clear input
      event.target.value = null;
    }
  };

  createMessage(body) {
    const now = Date.now();
    return {
      id: now + "", // uuid using timestamp guaranteed to change unless someone types faster than a millisecond
      date: now,
      address: this.currentConversation.address,
      threadId: this.currentConversation.id,
      isOutboxMessage: true,
      body
    };
  }

  scrollToBottom() {
    const messagesContainer = ReactDOM.findDOMNode(this.messagesContainer);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  attemptAutoSelect() {
    if (this.hasAutoSelected) {
      return;
    }

    if (!this.state.conversations || !this.state.conversations.length) {
      return;
    }

    this.hasAutoSelected = true;
    this.conversationClicked(this.state.conversations[0], 0);
  }

  onSentChanged = snapshot => {
    const sentMessages = snapshot.val() || {};
    this.setState({
      sentMessages
    });
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
    this.setState({ conversations }, () => {
      this.attemptAutoSelect();
    });
  };

  messagesChanged = snapshot => {
    const messages = snapshot.val() || [];
    this.setState(
      {
        messages: this.joinMessages(messages, this.state.outboxMessages)
      },
      () => {
        this.scrollToBottom();
      }
    );
  };

  outboxChanged = snapshot => {
    const outboxMessages = [];
    snapshot.forEach(msgSnapShot => {
      outboxMessages.push(msgSnapShot.val());
    });

    this.setState({
      messages: this.joinMessages(this.state.messages, outboxMessages)
    });
  };

  joinMessages(phoneMessages = [], outboxMessages = []) {
    return phoneMessages
      .slice()
      .concat(outboxMessages)
      .sort((m1, m2) => m1.date - m2.date);
  }

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

    this.desktopDB = firebase
      .database()
      .ref("desktop")
      .child(user.uid);

    this.sentDB = firebase
      .database()
      .ref("sent")
      .child(user.uid);

    this.contactsDB.on("value", this.contactsChanged);
    this.outboxDB.on("value", this.outboxChanged);
    this.conversationsDB.on("value", this.conversationsChanged);
    this.sentDB.on("value", this.onSentChanged);
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

    this.desktopDB.child("conversation").set(this.currentConversation.id);

    this.desktopDB
      .child("conversation")
      .onDisconnect()
      .set(null);
  }

  addMessageListener(conversation) {
    this.messagesDB.child(conversation.id).on("value", this.messagesChanged);
  }

  removeMessageListener(conversation) {
    this.messagesDB.child(conversation.id).off("value", this.messagesChanged);
  }

  render() {
    const {
      messages,
      outboxMessages,
      sentMessages,
      conversations,
      contactNames,
      selectedIndex
    } = this.state;

    return (
      <div className="home-page">
        <div className="nav-bar">
          <h1>Message</h1>
        </div>

        <div className="home-body">
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
                onClick={this.conversationClicked.bind(
                  this,
                  conversation,
                  index
                )}
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
                    message.status === MESSAGE_STATUS.SENT ||
                    message.isOutboxMessage ||
                    sentMessages[message.id]
                      ? "message-sent"
                      : "message-received"
                  }`}
                  onClick={() => {
                    console.log("message clicked", message);
                  }}
                >
                  <div className="message-text">
                    {message.type === "MMS" && !message.body
                      ? "IMAGE"
                      : message.body}
                  </div>

                  {message.isOutboxMessage || sentMessages[message.id] ? (
                    <div
                      className={`message-pending-mark
                      ${
                        sentMessages[message.id]
                          ? "message-pending-mark--sent"
                          : null
                      }
                    `}
                    >
                      ✓
                    </div>
                  ) : null}
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
      </div>
    );
  }
}
