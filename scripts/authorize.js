/* 
    (needs patch) 
    IMPLEMENTATION OF AUTHENTICATION ROUTE AFTER REDIRECT FROM GITHUB.
*/

const localAuth = {
  /**
   * Initialize
   */
  init() {
    this.KEY = 'codeforceshub_token';
    this.ACCESS_TOKEN_URL =
      'https://github.com/login/oauth/access_token';
    this.AUTHORIZATION_URL =
      'https://github.com/login/oauth/authorize';
    this.CLIENT_ID = '74e98c02bb5b5432f208';
    this.CLIENT_SECRET = '1251ce53b3efeab2c0069997dbf91b08e9ebde08';
    this.REDIRECT_URL = 'https://github.com/'; // for example, https://github.com
    this.SCOPES = ['repo'];
  },

  /**
   * Parses Access Code
   *
   * @param url The url containing the access code.
   */
  parseAccessCode(url) {
    if (url.match(/\?error=(.+)/)) {
      chrome.tabs.getCurrent(function (tab) {
        chrome.tabs.remove(tab.id, function () { });
      });
    } else {
      // eslint-disable-next-line
      console.log(url.match(/\?code=([\w\/\-]+)/)[1]);
      this.requestToken(url.match(/\?code=([\w\/\-]+)/)[1]);
    }
  },

  /**
   * Request Token
   *
   * @param code The access code returned by provider.
   */
  requestToken(code) {
    const that = this;
    const data = new FormData();
    data.append('client_id', this.CLIENT_ID);
    data.append('client_secret', this.CLIENT_SECRET);
    data.append('code', code);

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          that.finish(
            xhr.responseText.match(/access_token=([^&]*)/)[1],
          );
        } else {
          chrome.runtime.sendMessage({
            closeWebPage: true,
            isSuccess: false,
          });
        }
      }
    });
    xhr.open('POST', this.ACCESS_TOKEN_URL, true);
    xhr.send(data);
  },

  /**
   * Finish
   *
   * @param token The OAuth2 token given to the application from the provider.
   */
  finish(token) {
    /* Get username */
    // To validate user, load user object from GitHub.
    const AUTHENTICATION_URL = 'https://api.github.com/user';

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const username = JSON.parse(xhr.responseText).login;
          chrome.runtime.sendMessage({
            closeWebPage: true,
            isSuccess: true,
            token,
            username,
            KEY: this.KEY,
          });
        }
      }
    });
    xhr.open('GET', AUTHENTICATION_URL, true);
    xhr.setRequestHeader('Authorization', `token ${token}`);
    xhr.send();
  },
};

localAuth.init(); // load params.
const link = window.location.href;

/* Check for open pipe */
if (window.location.host === 'github.com') {
  chrome.storage.sync.get('pipe_codeforceshub', (data) => {
    if (data && data.pipe_codeforceshub) {
      localAuth.parseAccessCode(link);
    }
  });
}
