import EventEmitter from './eventEmitter';
import * as firebase from 'firebase';

export const EVENTS = {
  CONVERSATIONS_CHANGED: 'CONVERSATIONS_CHANGED'
};

class Firebase extends EventEmitter {
  init() {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log('cannot init firebase with no user!');
      return;
    }

    this.conversationsDB = firebase
      .database()
      .ref('conversations')
      .child(user.uid);

    this.contactsDB = firebase
      .database()
      .ref('contacts')
      .child(user.uid);

    this.handleConversationsChanged = this.handleConversationsChanged.bind(
      this
    );
    this.handleContactsChanged = this.handleContactsChanged.bind(this);

    this.conversationsDB.on('value', this.handleConversationsChanged);
    this.contactsDB.on('value', this.handleContactsChanged);
  }

  // listners
  handleConversationsChanged(snapshot) {
    const conversations = snapshot.val() || [];
    this.updateConversations(conversations, this.contacts);
  }

  handleContactsChanged(snapshot) {
    const contacts = snapshot.val() || [];
    this.updateConversations(this.conversations, contacts);
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

export default new Firebase(); // singleton
