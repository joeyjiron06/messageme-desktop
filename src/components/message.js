import React from 'react';
import { MESSAGE_STATUS } from '../util/constants';
import './message.css';

function shouldDrawMessageAsSent(message) {
  return message.status === MESSAGE_STATUS.SENT || message.status === MESSAGE_STATUS.REQUESTING;
}

function shouldDrawCheckmark(message) {
  return message.sentFromDesktop || message.status === MESSAGE_STATUS.REQUESTING;
}

function renderMMSContent(message, onClick) {
  const parts = (message.parts || []).map(part => {
    switch (part.type) {
      case 'IMAGE':
        if (!part.url) {
          return (
            <div
              key={part.id}
              className="messsage-image-icon"
              onClick={() => {
                console.log('image message clicked', message);
                if (typeof onClick === 'function') {
                  onClick(message);
                }
              }}
            >
              <i className="material-icons">image</i>
            </div>
          );
        }

        return <img src={part.url} key={part.id} className="message-image" />;

      default:
        return null;
    }
  });

  if (!parts.length) {
    return null;
  }

  return <div className="message-parts">{parts}</div>;
}

export default ({ message, onClick, onMmsContentClicked }) => (
  <div
    key={message.id}
    className={`message ${shouldDrawMessageAsSent(message) ? 'message-sent' : 'message-received'}`}
    onClick={() => {
      console.log('message clicked', message);
      if (typeof onClick === 'function') {
        onClick(message);
      }
    }}
  >
    <div className="message-content">
      <div className="message-text">{message.body}</div>

      {renderMMSContent(message, onMmsContentClicked)}
    </div>

    {shouldDrawCheckmark(message) ? (
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
