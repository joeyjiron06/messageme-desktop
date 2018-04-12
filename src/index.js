import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app';
import registerServiceWorker from './registerServiceWorker';
import packageJson from './package.alias.json';
console.log('pagage', packageJson);
ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
