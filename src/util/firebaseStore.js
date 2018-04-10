import EventEmitter from './eventEmitter';
import * as firebase from 'firebase';

export const EVENTS = {
  CONVERSATIONS_CHANGED: 'CONVERSATIONS_CHANGED',
  CONVERSATION_SELECTED: 'CONVERSATION_SELECTED',
  MESSAGES_CHANGED: 'MESSAGES_CHANGED',
  PHONE_STATUS_CHANGED: 'PHONE_STATUS_CHANGED'
};

class FirebaseStore extends EventEmitter {
  init() {
    const user = firebase.auth().currentUser;

    // setup databases
    const firebaseDB = firebase.database().ref(user.uid);
    this.db = {
      conversations: firebaseDB.child('conversations'), // list of conversations
      contacts: firebaseDB.child('contacts'), // contacts hashed by phone numbers
      messages: firebaseDB.child('messages'), // messages sent by the phone hashed by conversation id
      outbox: firebaseDB.child('outbox'), // messages sent from desktop
      desktop: firebaseDB.child('desktop'), // state of the desktop
      mmsUploads: firebaseDB.child('mmsUploadUrls'), // urls of images uploaded to firebase storage
      phone: firebaseDB.child('phone') // phone state stuff
    };

    // setup default values for datasets
    this.messages = []; // messages posted on firebase
    this.conversations = [];
    this.contacts = {};

    // add listeners
    this.db.conversations.on('value', (this.handleConversationsChanged = this.handleConversationsChanged.bind(this)));
    this.db.contacts.on('value', (this.handleContactsChanged = this.handleContactsChanged.bind(this)));

    // when we disconnect we need to set the value to null so the phone
    // wont post messages, doing unecessary work
    this.db.desktop
      .child('conversation')
      .onDisconnect()
      .set(null);

    this.db.phone
      .child('online')
      .on('value', (this.handlePhoneOnlineChanged = this.handlePhoneOnlineChanged.bind(this)));
  }

  setConversation(conversation) {
    // remove previous listener
    if (this.conversation) {
      this.db.messages.child(this.conversation.id).off('value', this.handleMessagesChanged);
    }

    // save or laster
    this.conversation = conversation;

    // add a listener
    this.db.messages
      .child(conversation.id)
      .on('value', (this.handleMessagesChanged = this.handleMessagesChanged.bind(this)));

    // add this to the desktop db so the phone will listen to this value
    // and post the messages for this conversation
    this.db.desktop.child('conversation').set(conversation.id);

    this.emit({
      type: EVENTS.CONVERSATION_SELECTED,
      conversation
    });
  }

  sendMessage(message) {
    // update the outbox messages now instead of waiting for the outboxChanged
    // callback to get triggered. this helps redraw the UI quickly
    const messages = [...this.messages, message];
    this.updateMessages(messages);

    // add to firebase, this will trigget a outbox change event
    // also, the phone is listening for changes to the outbox and
    // will attempt to send the message, then move it to "sent" db
    this.db.outbox.child(message.id).set(message);
  }

  requestMMSContent(message, part) {
    return new Promise((resolve, reject) => {
      const mmsUploadUrlsDB = this.db.mmsUploads.child(part.id);

      const timeout = setTimeout(() => {
        finish(null, true);
      }, 20000);

      const finish = (url, timedOut) => {
        clearTimeout(timeout);
        mmsUploadUrlsDB.off('value', onUrlAdded);

        if (timedOut) {
          reject({
            message: 'timed out'
          });
        } else if (!url) {
          reject({
            message: 'no url'
          });
        } else {
          resolve(url);
        }
      };

      const onUrlAdded = snapshot => {
        const url = snapshot.val();
        if (!url) {
          return;
        }
        finish(url, false);
      };

      mmsUploadUrlsDB.on('value', onUrlAdded);

      this.db.desktop
        .child('requests')
        .child('mmsUpload')
        .child(part.id)
        .set(true);
    });
  }

  // listners
  handleConversationsChanged(snapshot) {
    const conversations = snapshot.val() || [];
    this.updateConversations(conversations, this.contacts);
  }

  handleContactsChanged(snapshot) {
    const contacts = snapshot.val() || {};
    this.updateConversations(this.conversations, contacts);
  }

  handlePhoneOnlineChanged(snapshot) {
    this.phoneOnline = !!snapshot.val();
    this.emit({
      type: EVENTS.PHONE_STATUS_CHANGED,
      phoneOnline: this.phoneOnline
    });
  }

  handleMessagesChanged(snapshot) {
    const messages = snapshot.val() || [];
    console.log('messages changed', messages);
    this.updateMessages(messages);
  }

  // helpers

  updateMessages(messages) {
    this.messages = messages;
    this.emit({
      type: EVENTS.MESSAGES_CHANGED,
      messages: this.messages
    });
  }

  updateConversations(conversations, contacts) {
    // everything is the same. no updates made
    if (conversations === this.conversations && contacts === this.contacts) {
      return;
    }

    if (conversations && contacts) {
      conversations.forEach(conversation => {
        conversation.displayName = conversation.address
          .split(',')
          .map(number => contacts[number] || number)
          .join(', ');
      });
    }

    this.conversations = conversations;
    this.contacts = contacts;

    this.emit({
      type: EVENTS.CONVERSATIONS_CHANGED,
      conversations
    });
  }
}

export default new FirebaseStore(); // singleton