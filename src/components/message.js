import React from 'react';
import { MESSAGE_STATUS } from '../util/constants';
import './message.css';
import IconButton from 'material-ui/IconButton';

export default ({ message, onClick, onMmsContentClicked }) => (
  <div
    key={message.id}
    className={
      message.status === MESSAGE_STATUS.SENT ||
      message.status === MESSAGE_STATUS.REQUESTING ||
      message.status === MESSAGE_STATUS.FAILED
        ? 'message message-sent'
        : 'message message-received'
    }
    onClick={() => {
      if (typeof onClick === 'function') {
        onClick(message);
      }
    }}
  >
    <div className="message-content">
      <div className="message-text">{message.body}</div>

      {message.parts && message.parts.length ? (
        <div className="message-parts">
          {message.parts.map(part => (
            // TODO handle movies as well
            <ImagePart
              key={part.id}
              part={part}
              onClick={() => {
                if (typeof onClick === 'function') {
                  onClick(message, part);
                }
              }}
            />
          ))}
        </div>
      ) : null}
    </div>

    <StatusMark message={message} />
  </div>
);

const StatusMark = ({ message }) => {
  if (message.status === MESSAGE_STATUS.REQUESTING) {
    return <div className="message-status-mark">✓</div>;
  }

  if (message.status === MESSAGE_STATUS.FAILED) {
    return <div className="message-status-mark message-status-mark--failed">✗</div>;
  }

  if (message.sentFromDesktop) {
    return <div className="message-status-mark message-status-mark--sent">✓</div>;
  }

  return null;
};

const ImagePart = ({ part, onClick }) => {
  if (part.url) {
    return <img src={part.url} className="message-image" alt="mms message" />;
  }

  return (
    <IconButton
      className="messsage-image-icon"
      iconClassName="material-icons"
      iconStyle={{
        color: '#9e9e9e'
      }}
      style={{
        backgroundColor: 'white'
      }}
      onClick={() => {
        if (typeof onClick === 'function') {
          onClick(part);
        }
      }}
    >
      image
    </IconButton>
  );
};
