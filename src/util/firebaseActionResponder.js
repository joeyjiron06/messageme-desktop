import * as firebase from 'firebase';
import { EVENTS } from './constants';

export default () => {
  let db;
  let store;
  let conversation;

  const handleMessagesChanged = snapshot => {
    store.dispatch({
      type: EVENTS.MESSAGES_CHANGED,
      messages: snapshot.val() || []
    });
  };
  const handleConversationsChanged = snapshot => {
    store.dispatch({
      type: EVENTS.CONVERSATIONS_CHANGED,
      conversations: snapshot.val() || []
    });
  };
  const handleContactsChanged = snapshot => {
    store.dispatch({
      type: EVENTS.CONTACTS_CHANGED,
      contacts: snapshot.val()
    });
  };
  const handlePhoneOnlineChanged = snapshot => {
    store.dispatch({
      type: EVENTS.PHONE_STATUS_CHANGED,
      phoneOnline: !!snapshot.val()
    });
  };

  return (event, _store) => {
    switch (event.type) {
      case EVENTS.INIT:
        store = _store;
        // if you are reading this code please don't use my firebase api config.
        // you can get your own config from here https://firebase.google.com/docs/web/setup
        firebase.initializeApp({
          apiKey: 'AIzaSyABLDsce39YrbqSL2od0xdgYUHvvMdK7d0',
          authDomain: 'messageme-644c5.firebaseapp.com',
          databaseURL: 'https://messageme-644c5.firebaseio.com',
          projectId: 'messageme-644c5',
          storageBucket: 'messageme-644c5.appspot.com',
          messagingSenderId: '809721868493'
        });

        firebase.auth().onAuthStateChanged(user => {
          console.log('onauthstatechanged');
          if (user) {
            db = firebase.database().ref(user.uid);

            // add listeners
            db.child('conversations').on('value', handleConversationsChanged);
            db.child('contacts').on('value', handleContactsChanged);

            // when we disconnect we need to set the value to null so the phone
            // wont post messages, doing unecessary work
            db
              .child('desktop')
              .child('conversation')
              .onDisconnect()
              .set(null);

            db
              .child('phone')
              .child('online')
              .on('value', handlePhoneOnlineChanged);
          }

          store.dispatch({
            type: EVENTS.USER_CHANGED,
            user
          });
        });
        break;

      case EVENTS.LOGIN:
        // firebase.auth().onAuthStateChanged will get called and dispatch a user changed event
        firebase
          .auth()
          .signInWithPopup(new firebase.auth.FacebookAuthProvider())
          .then(function(result) {
            console.log('logged in!', result);
          })
          .catch(error => {
            console.error('error logging in', error);
          });
        break;

      case EVENTS.LOGOUT:
        firebase
          .auth()
          .signOut()
          .then(() => {
            localStorage.clear();
          })
          .catch(error => {
            console.error('error signing out', error);
          });
        break;

      case EVENTS.CONVERSATION_SELECTED:
        if (conversation) {
          db
            .child('messages')
            .child(conversation.id)
            .off('value', handleMessagesChanged);
        }

        // save or laster
        conversation = event.conversation;

        // add a listener
        db
          .child('messages')
          .child(conversation.id)
          .on('value', handleMessagesChanged);

        // add this to the desktop db so the phone will listen to this value
        // and post the messages for this conversation
        db
          .child('desktop')
          .child('conversation')
          .set(conversation.id);
        break;

      case EVENTS.SEND_MESSAGE:
        const message = event.message;
        // update the outbox messages now instead of waiting for the outboxChanged
        // callback to get triggered. this helps redraw the UI quickly
        const messages = [...store.messages, message];
        store.dispatch({
          type: EVENTS.MESSAGES_CHANGED,
          messages
        });

        // add to firebase, this will trigget a outbox change event
        // also, the phone is listening for changes to the outbox and
        // will attempt to send the message, then move it to "sent" db
        db
          .child('outbox')
          .child(message.id)
          .set(message);
        break;
      case EVENTS.REQUEST_MMS_UPLOAD:
        db
          .child('desktop')
          .child('requests')
          .child('mmsUpload')
          .child(event.part.id)
          .set(true);
        break;
      default:
        break;
    }
  };
};
