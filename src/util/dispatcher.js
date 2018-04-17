/**
 * A simpler version of the node js event emitter class. This class will notify all listeners
 * and allow them to ignore the events they do or dont care about.
 * @example
 *  let dispatcher = new Dispatcher();
 *  dispatcher.subscribe(callback);
 *  dispatcher.dispatch({ type : 'myEvent', payload : 'hello' });
 *
 * @class Dispatcher
 */
class Dispatcher {
  constructor() {
    this.subscribers = [];
  }

  /**
   * Add a subscriber for an event.
   * @param {function} callback
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return this;
  }

  /**
   * Remove a subscriber.
   * @param {function} callback
   */
  unsubscribe(callback) {
    this.subscribers = this.subscribers.filter(subscriber => subscriber !== callback);
    return this;
  }

  /**
   * Emmit an event to notify subscribers.
   * @param {object} event - the event with a payload to emit
   */
  dispatch(event) {
    this.subscribers.forEach(callback => {
      callback(event, this);
    });
  }
}

export default Dispatcher;
