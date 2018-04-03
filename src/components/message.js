import React from 'react';
import { MESSAGE_STATUS } from '../util/constants';
import './message.css';

function drawMessageAsSent(message) {
  return message.status === MESSAGE_STATUS.SENT || message.status === MESSAGE_STATUS.REQUESTING;
}

function drawCheckmark(message) {
  return message.sentFromDesktop || message.status === MESSAGE_STATUS.REQUESTING;
}

export default ({ message, onClick }) => (
  <div
    key={message.id}
    className={`message ${drawMessageAsSent(message) ? 'message-sent' : 'message-received'}`}
    onClick={() => {
      console.log('message clicked', message);
      if (typeof onClick === 'function') {
        onClick(message);
      }
    }}
  >
    <div className="message-text">
      {message.body}

      {(message.type === 'MMS' && !message.body) || message.imageType ? (
        <div className="messsage-image">{message.imageType || 'IMAGE'}</div>
      ) : null}
    </div>

    {drawCheckmark(message) ? (
      <div
        className={`message-pending-mark
          ${message.sentFromDesktop ? 'message-pending-mark--sent' : null}
        `}
      >
        ✓
      </div>
    ) : null}
  </div>
);
