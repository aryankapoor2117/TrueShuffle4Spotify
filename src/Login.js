import React from 'react';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirectUri = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_SPOTIFY_REDIRECT_URI_PROD
  : process.env.REACT_APP_SPOTIFY_REDIRECT_URI_LOCAL;
const scopes = 'streaming user-read-email user-read-private user-read-currently-playing playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state';

const LOGIN_URL = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

function Login() {
  return (
    <div className="App">
      <header className="App-header">
        <a className="btn-spotify" href={LOGIN_URL}>
          Login with Spotify
        </a>
      </header>
    </div>
  );
}

export default Login;