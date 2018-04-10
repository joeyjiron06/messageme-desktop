import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as firebase from 'firebase';
import Conversation from '../components/conversation';
import Message from '../components/message';
import NavBar from '../components/navbar';
import FirebaseStore, { EVENTS } from '../util/firebaseStore';
import { MESSAGE_STATUS } from '../util/constants';
import './home.css';

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
      const message = this.createMessage(body);

      // send it via firebase, wait for MESSAGES_CHANGED event to fire
      FirebaseStore.sendMessage(message);

      // clear input
      event.target.value = null;
    }
  };

  onMmsContentClicked = (message, part) => {
    FirebaseStore.requestMMSContent(message, part)
      .then(url => {
        part.url = url;
        // trigger a UI update
        this.setState({
          messages: this.state.messages
        });
      })
      .catch(err => {
        console.error('error fetching url', err);
      });
  };

  conversationClicked(conversation) {
    console.log('conversation clicked', conversation);
    const { currentConversation } = this.state;

    // optimization - already displaying this conversation, so dont change anything
    if (currentConversation && currentConversation.id === conversation.id) {
      return;
    }

    // update the UI
    this.setState({
      isLoading: true,
      messages: [],
      currentConversation: conversation
    });

    // tell firebase the we are looking at the conversation so that the phone
    // will update the databse with messages for this conversation, wait for the
    // event.type to be MESSAGES_CHANGED
    FirebaseStore.setConversation(conversation);
  }

  // HELPERS

  createMessage(body) {
    const now = Date.now();
    return {
      id: now + '', // uuid using timestamp guaranteed to change unless someone types faster than a millisecond
      date: now,
      address: this.state.currentConversation.address,
      conversationId: this.state.currentConversation.id,
      status: MESSAGE_STATUS.REQUESTING, // set status as requesting for the UI
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
      case EVENTS.MESSAGES_CHANGED:
        this.handleMessagesChanged(event.messages);
        break;
      default:
        console.log('unhandled event', event);
        break;
    }
  };

  handleMessagesChanged(messages) {
    this.attemptToShowNotification(messages);
    this.setState(
      {
        isLoading: false,
        messages
      },
      () => {
        this.scrollToBottom();
      }
    );
  }

  attemptToShowNotification(messages) {
    return;

    const lastMessage = messages[messages.length - 1];

    if (this.state.isLoading) {
      return;
    }

    if (!lastMessage || lastMessage.status !== MESSAGE_STATUS.RECEIVED) {
      return;
    }

    let title = FirebaseStore.contacts[lastMessage.address] || lastMessage.address;

    this.showNotification(title, lastMessage.body);
  }

  // LIFECYCLE
  componentDidMount() {
    FirebaseStore.addListener(this.handleFirebaseEvent);
  }

  componentWillUnmount() {
    FirebaseStore.removeListener(this.handleFirebaseEvent);
  }

  render() {
    const { messages, conversations, currentConversation, isLoading } = this.state;

    return (
      <div className="home-page">
        <NavBar />

        <div className="home-body">
          {/* CONVERSATIONS on the left */}
          <div className="home-convo-list">
            {conversations.map(conversation => (
              <Conversation
                key={conversation.address}
                conversation={conversation}
                isSelected={currentConversation && currentConversation.id === conversation.id}
                onClick={this.conversationClicked.bind(this, conversation)}
              />
            ))}
          </div>

          {/* MESSAGES on the right */}
          <div className="home-right-side">
            <div
              className="home-message-list"
              ref={el => {
                this.messagesContainer = el;
              }}
            >
              {isLoading ? (
                <div>Loading...</div>
              ) : (
                messages.map(message => (
                  <Message key={message.id} message={message} onMmsContentClicked={this.onMmsContentClicked} />
                ))
              )}
            </div>

            <div className="home-input-container">
              <input type="text" placeholder="Type a message..." className="home-input" onKeyPress={this.onKeyPress} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
