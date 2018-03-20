import React, { Component } from "react";

import * as firebase from "firebase";

export default class MainRoute extends Component {
  onRouterRef = router => {
    console.log("on router ref", router);
    firebase.auth().onAuthStateChanged(user => {
      // We ignore token refresh events.
      if (user && this.currentUID === user.uid) {
        return;
      }

      this.currentUID = user.uid;
      router.history.replace("/home");
    });
  };

  componentDidMount() {
    console.log("main route did mount");
  }
}
