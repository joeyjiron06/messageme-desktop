import { EVENTS } from './constants';

export default () => {
  function updateConversations(conversations, contacts) {
    return conversations.map(conversation => {
      conversation.displayName = conversation.address
        .split(',')
        .map(number => contacts[number] || number)
        .join(', ');
      return conversation;
    });
  }

  return (event, store) => {
    switch (event.type) {
      case EVENTS.USER_CHANGED:
        store.user = event.user;
        break;
      case EVENTS.PHONE_STATUS_CHANGED:
        store.phoneOnline = event.phoneOnline;
        break;
      case EVENTS.MESSAGES_CHANGED:
        store.messages = event.messages;
        break;
      case EVENTS.CONVERSATIONS_CHANGED:
        if (!event.updatedWithContactNames) {
          store.conversations = updateConversations(event.conversations, store.contacts || {});
        } else {
          store.conversations = event.conversations;
        }
        break;
      case EVENTS.CONTACTS_CHANGED:
        store.contacts = event.contacts;

        if (store.conversations && store.contacts) {
          store.dispatch({
            type: EVENTS.CONVERSATIONS_CHANGED,
            conversations: updateConversations(store.conversations, store.contacts),
            updatedWithContactNames: true
          });
        }
        break;
      case EVENTS.CONVERSATION_SELECTED:
        store.conversation = event.conversation;
        break;
      default:
        break;
    }
  };
};
