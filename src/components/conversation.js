import React from 'react';
import './conversation.css';

export default ({ conversation, onClick, isSelected }) => (
  <div
    key={conversation.address}
    className={'conversation ' + (isSelected ? 'conversation-selected ' : null)}
    onClick={() => {
      if (typeof onClick === 'function') {
        onClick(conversation);
      }
    }}
  >
    <div className="conversation-address">
      {conversation.displayName || conversation.address}
    </div>

    <div className="conversation-snippet">
      {!conversation.body && conversation.messageType === 'MMS'
        ? 'MMS Message'
        : conversation.body}
    </div>
  </div>
);
