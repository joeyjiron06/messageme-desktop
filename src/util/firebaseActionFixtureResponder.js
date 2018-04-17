import { EVENTS } from './constants';

export default () => {
  let db;

  return (event, store) => {
    switch (event.type) {
      case EVENTS.INIT:
        fetch('messageme-db.json')
          .then(res => res.json())
          .then(json => {
            db = json['zyEwviOqfCP0cOqL306TeoELzib2'];
            store.dispatch({
              type: EVENTS.USER_CHANGED,
              user: {
                displayName: 'Joey Jiron',
                photoUrl: 'ic_chat_bubble_black_24px.svg',
                uid: 'zyEwviOqfCP0cOqL306TeoELzib2'
              }
            });

            store.dispatch({
              type: EVENTS.CONVERSATIONS_CHANGED,
              conversations: db.conversations
            });

            store.dispatch({
              type: EVENTS.CONTACTS_CHANGED,
              contacts: db.contacts
            });

            store.dispatch({
              type: EVENTS.PHONE_STATUS_CHANGED,
              phoneOnline: true
            });
          })
          .catch(err => {
            console.error(err);
          });
        break;

      case EVENTS.CONVERSATION_SELECTED:
        const messages = db.messages[event.conversation.id] || [];
        store.dispatch({
          type: EVENTS.MESSAGES_CHANGED,
          messages
        });
        break;

      case EVENTS.LOGIN:
        break;

      case EVENTS.LOGOUT:
        break;

      case EVENTS.SEND_MESSAGE:
        break;

      case EVENTS.REQUEST_MMS_UPLOAD:
        break;

      default:
        break;
    }
  };
};
