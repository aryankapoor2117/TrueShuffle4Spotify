import React from 'react';

const clientId = '51c41fdf0b4e45c5b99dbb0795aabbf3';
const redirectUri = 'http://localhost:3000/callback';
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