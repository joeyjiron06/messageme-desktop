import Dispatcher from './dispatcher';
import firebaseActionResponder from './firebaseActionResponder';
// import firebaseActionFixtureResponder from './firebaseActionFixtureResponder';
import firebaseStateUpdater from './firebaseStateUpdater';

const store = new Dispatcher();
Object.assign(store, {
  user: null,
  messages: null,
  conversation: null,
  conversations: null,
  phoneOnline: false
});

store
  .subscribe(event => {
    console.log('[FIREBASE STORE]', event.type, event);
  })
  .subscribe(firebaseActionResponder())
  // .subscribe(firebaseActionFixtureResponder())
  .subscribe(firebaseStateUpdater(store));

export default store;
