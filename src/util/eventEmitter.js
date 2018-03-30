/**
 * A simpler version of the event emitter class. This class will notify all listeners
 * and allow them to ignore the events they do or dont care about.
 * @example
 *  let emitter = new EventEmitter();
 *  emitter.addListener(callback);
 *  emitter.emit({ type : 'myEvent', payload : 'hello' });
 *
 * @class EventEmitter
 */
class EventEmitter {
  constructor() {
    this.listeners = [];
  }

  /**
   * Add a listener for an event.
   * @param {function} callback
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove a listener.
   * @param {function} callback
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Emmit an event to notify listeners.
   * @param {object} event - the event with a payload to emit
   */
  emit(event) {
    this.listeners.forEach(callback => {
      callback(event);
    });
  }
}

export default EventEmitter;
