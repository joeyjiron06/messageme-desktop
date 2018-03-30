import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as firebase from 'firebase';
import { List, ListItem } from 'material-ui/List';
import './home.css';
import Conversation from '../components/conversation';

import Firebase, { EVENTS } from '../util/firebase';

const MESSAGE_STATUS = {
  RECEIVED: 1,
  SENT: 2
};

const CONVERSATION_TYPE = {
  SMS: 'SMS',
  MMS: 'MMS'
};

function playSound(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.autoplay = true;
    audio.loop = false;
    audio.onended = resolve;
    audio.onerror = reject;
    audio.src = url;
  });
}

// https://yalantis.com/blog/what-i-learned-building-smsmms-messenger-for-android/
export default class Home extends Component {
  state = {
    messages: [], // the messages the phone has sent
    outboxMessages: [], // the messages this app has requested to be sent
    sentMessages: {}, // a hash { phoneMessageId : desktopMessageId }
    conversations: [], // phones list of conversations
    contacts: {}, // a hash { phoneNumber : name }
    currentConversation: null // the current conversation being viewed
  };

  //FIREBASE LISTNERS

  onSentChanged = snapshot => {
    const sentMessages = snapshot.val() || {};
    this.setState({
      sentMessages
    });
  };

  messagesChanged = snapshot => {
    const messages = snapshot.val() || [];
    const lastMessage = messages[messages.length - 1];

    if (
      !this.state.isLoading &&
      lastMessage &&
      lastMessage.status === MESSAGE_STATUS.RECEIVED
    ) {
      let title = lastMessage.address;
      if (this.state.contacts && this.state.contacts[lastMessage.address]) {
        title = this.state.contacts[lastMessage.address];
      }

      this.showNotification(title, lastMessage.body);
    }

    console.log('messages changed', messages);

    this.setState(
      {
        isLoading: false,
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

  // UI LISTENERS

  onKeyPress = event => {
    if (event.key === 'Enter') {
      const body = event.target.value;
      if (!body) {
        return;
      }

      if (!this.state.currentConversation) {
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

  conversationClicked(conversation) {
    console.log('conversation clicked', conversation);
    const { currentConversation } = this.state;

    // optimization - already displaying this conversation, so dont change anything
    if (currentConversation && currentConversation.id === conversation.id) {
      return;
    }

    // remove old listener for messages
    if (currentConversation) {
      this.messagesDB
        .child(currentConversation.id)
        .off('value', this.messagesChanged);
    }

    // update the UI
    this.setState({
      isLoading: true,
      messages: [],
      currentConversation: conversation
    });

    // add a listener
    this.messagesDB.child(conversation.id).on('value', this.messagesChanged);

    // add this to the desktop db so the phone will listen to this value
    // and post the messages for this conversation
    this.desktopDB.child('conversation').set(conversation.id);

    // when we disconnect we need to set the value to null so the phone
    // wont post messages, doing unecessary work
    this.desktopDB
      .child('conversation')
      .onDisconnect()
      .set(null);
  }

  // HELPERS

  joinMessages(phoneMessages = [], outboxMessages = []) {
    return phoneMessages
      .slice()
      .concat(outboxMessages)
      .sort((m1, m2) => m1.date - m2.date);
  }

  createMessage(body) {
    const now = Date.now();
    return {
      id: now + '', // uuid using timestamp guaranteed to change unless someone types faster than a millisecond
      date: now,
      address: this.state.currentConversation.address,
      threadId: this.state.currentConversation.id,
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

  showNotification(title, body) {
    new Notification(title, {
      body,
      silent: false,
      sound: 'http://localhost:3000/incoming_message.mp3'
      // icon:
      // 'https://raw.githubusercontent.com/google/material-design-icons/master/communication/2x_web/ic_chat_bubble_black_24dp.png'
    });
    this.playMessageSound();
  }

  playMessageSound() {
    if (this.isPlayingSound) {
      return;
    }

    this.isPlayingSound = true;
    playSound('incoming_message.mp3')
      .then(() => {
        this.isPlayingSound = false;
      })
      .catch(err => {
        this.isPlayingSound = false;
        console.error('error playing sound', err);
      });
  }

  handleFirebaseEvent = event => {
    console.log('firebase event', event);
    switch (event.type) {
      case EVENTS.CONVERSATIONS_CHANGED:
        this.setState(
          {
            conversations: event.conversations
          },
          () => {
            this.attemptAutoSelect();
          }
        );
        break;
    }
  };

  // LIFECYCLE
  componentDidMount() {
    window.home = this;
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log('what!this shouldnt happen, no user');
      return;
    }

    this.messagesDB = firebase
      .database()
      .ref('messages')
      .child(user.uid);

    this.outboxDB = firebase
      .database()
      .ref('outbox')
      .child(user.uid);

    this.desktopDB = firebase
      .database()
      .ref('desktop')
      .child(user.uid);

    this.sentDB = firebase
      .database()
      .ref('sent')
      .child(user.uid);

    Firebase.addListener(this.handleFirebaseEvent);
    Firebase.init();

    this.outboxDB.on('value', this.outboxChanged);
    this.sentDB.on('value', this.onSentChanged);
  }

  componentWillUnmount() {
    this.contactsDB.off('value', this.contactsChanged);
    this.outboxDB.off('value', this.outboxChanged);
    this.conversationsDB.off('value', this.conversationsChanged);
    this.sentDB.off('value', this.onSentChanged);
  }

  render() {
    const {
      messages,
      outboxMessages,
      sentMessages,
      conversations,
      contacts,
      currentConversation,
      isLoading
    } = this.state;

    return (
      <div className="home-page">
        <div className="nav-bar">
          <h1>Messages</h1>
        </div>

        <div className="home-body">
          <div className="home-convo-list">
            {conversations.map(conversation => (
              <Conversation
                key={conversation.address}
                conversation={conversation}
                isSelected={
                  currentConversation &&
                  currentConversation.id === conversation.id
                }
                onClick={this.conversationClicked.bind(this, conversation)}
              />
            ))}
          </div>

          <div className="home-right-side">
            <div
              className="home-message-list"
              style={{ padding: 20 }}
              ref={el => {
                this.messagesContainer = el;
              }}
            >
              {isLoading ? (
                <div>Loading...</div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`message ${
                      message.status === MESSAGE_STATUS.SENT ||
                      message.isOutboxMessage ||
                      sentMessages[message.id]
                        ? 'message-sent'
                        : 'message-received'
                    }`}
                    onClick={() => {
                      console.log('message clicked', message);
                    }}
                  >
                    <div className="message-text">
                      {message.body}

                      {(message.type === 'MMS' && !message.body) ||
                      message.imageType ? (
                        <div className="messsage-image">
                          {message.imageType || 'IMAGE'}
                        </div>
                      ) : null}
                    </div>

                    {message.isOutboxMessage || sentMessages[message.id] ? (
                      <div
                        className={`message-pending-mark
                      ${
                        sentMessages[message.id]
                          ? 'message-pending-mark--sent'
                          : null
                      }
                    `}
                      >
                        ✓
                      </div>
                    ) : null}
                  </div>
                ))
              )}
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
