'use strict';

import fetch from 'isomorphic-fetch';

export class RemoteOutput {
  constructor(url) {
    if (!url) throw new Error('Remote output \'url\' is missing');
    if (url.endsWith('/')) url = url.slice(0, -1);
    url += '/logs';
    this.url = url;
  }

  write(logName, hostName, level, message) {
    (async function() {
      await fetch(this.url, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logName, hostName, level, message })
      });
    }).call(this).catch(console.error);
  }
}

export default RemoteOutput;
