import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const shuffleArray = (array) => {
    // Fisher-Yates shuffle algorithm
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  
  const addToQueue = async (playlistId, token) => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      const trackUris = data.items.map(item => item.track.uri);
  
      // Shuffle the track URIs using Fisher-Yates algorithm
      const shuffledUris = shuffleArray(trackUris);
  
      // Get the current queue
      const queueResponse = await fetch('https://api.spotify.com/v1/me/player/queue', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const queueData = await queueResponse.json();
      const currentQueue = queueData.queue.map(item => item.uri);
  
      // Filter out duplicates
      const uniqueUris = shuffledUris.filter(uri => !currentQueue.includes(uri));
  
      // Add unique URIs to the queue
      for (const uri of uniqueUris) {
        await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Error adding tracks to the queue:', error);
    }
  };

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: #e0f0ff; 
`;

const PlayerContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
`;

const NowPlaying = styled.div`
  display: flex;
  align-items: center;
  margin-right: 2rem;
`;

const Cover = styled.img`
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
`;

const TrackInfo = styled.div`
  margin-left: 1rem;
`;

const TrackName = styled.div`
  font-weight: bold;
  font-size: 1.2rem;
`;

const ArtistName = styled.div`
  font-size: 0.9rem;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled.button`
  background-color: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  margin: 0 0.5rem;
`;

const SearchBar = styled.input`
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  max-width: 300px;
  margin-bottom: 1rem;
`;

const PlaylistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-gap: 1rem;
`;
const PlaylistItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
`;

const PlaylistCover = styled.img`
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
`;

const PlaylistName = styled.span`
  margin-top: 0.5rem;
  font-size: 1rem;
  font-family: 'Montserrat', sans-serif; // Modern font
`;

const track = {
    name: "",
    album: {
        images: [
            { url: "" }
        ]
    },
    artists: [
        { name: "" }
    ]
}

function WebPlayback(props) {

    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [player, setPlayer] = useState(undefined);
    const [current_track, setTrack] = useState(track);
    const [playlistName, setPlaylistName] = useState('');
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');


    useEffect(() => {

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {

            const player = new window.Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(props.token); },
                volume: 0.5
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.addListener('player_state_changed', ( state => {

                if (!state) {
                    return;
                }

                setTrack(state.track_window.current_track);
                setPaused(state.paused);

                player.getCurrentState().then( state => { 
                    (!state)? setActive(false) : setActive(true) 
                });

            }));
            addToQueue(1);
            player.connect(); 

            const fetchUserPlaylists = async (offset = 0) => {
                const params = new URLSearchParams();
                params.append('offset', offset);
                params.append('limit', 50); // Maximum limit allowed by the Spotify API
          
                try {
                  const response = await fetch(`https://api.spotify.com/v1/me/playlists?${params}`, {
                    headers: {
                      'Authorization': `Bearer ${props.token}`
                    }
                  });
                  const data = await response.json();
          
                  setUserPlaylists(prevPlaylists => [...prevPlaylists, ...data.items]);
          
                  if (data.next) {
                    const nextOffset = new URLSearchParams(new URL(data.next).search).get('offset');
                    fetchUserPlaylists(nextOffset);
                  }
                } catch (error) {
                  console.error('Error fetching playlists:', error);
                }
              };
          
              fetchUserPlaylists();          
            
        };
    }, []);


    const handleContextInfo = async (context) => {
        if (context && context.type === 'playlist') {
            const playlistId = context.href.substring(37);
            const playlistName = await fetchPlaylistName("4BilTWvqlCSDyp2Gt4ScMN");
            setPlaylistName(playlistName);
        } else { 
            setPlaylistName('Test2');
        }
    }
        

    const fetchPlaylistName = async (playlistId) => {
        try {
            const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                headers: {
                    'Authorization': `Bearer ${props.token}`
                }
            });
            const data = await response.json();
            setPlaylistName(data.name);
        } catch (error) {
            console.error('Error fetching playlist name:', error);
        }
    }

    const handlePlaylistClick = async (playlistId) => {
        await addToQueue(playlistId, props.token);
      };

    const filteredPlaylists = userPlaylists.filter(playlist =>
        playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (!is_active) { 
        return (
            <>
                <div className="container">
                    <div className="main-wrapper">
                        <b> Instance not active. Transfer your playback using your Spotify app </b>
                    </div>
                </div>
            </>)
    } else {
        return (
            <Container>
            <PlayerContainer>
              <NowPlaying>
                <Cover src={current_track.album.images[0].url} alt={current_track.name} />
                <TrackInfo>
                  <TrackName>{current_track.name}</TrackName>
                  <ArtistName>{current_track.artists[0].name}</ArtistName>
                </TrackInfo>
              </NowPlaying>
              <Controls>
                <Button onClick={() => player.previousTrack()}>&lt;&lt;</Button>
                <Button onClick={() => player.togglePlay()}>{is_paused ? 'PLAY' : 'PAUSE'}</Button>
                <Button onClick={() => player.nextTrack()}>&gt;&gt;</Button>
              </Controls>
            </PlayerContainer>
            <div className="playlists-container">
          <SearchBar
            type="text"
            placeholder="Search playlists..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <h2>Your Playlists</h2>
          <PlaylistGrid>
            {filteredPlaylists.map(playlist => (
              <PlaylistItem key={playlist.id} onClick={() => handlePlaylistClick(playlist.id)}>
                <PlaylistCover
                  src={playlist.images[0]?.url || 'https://via.placeholder.com/150'}
                  alt={playlist.name}
                />
                <PlaylistName>{playlist.name}</PlaylistName>
              </PlaylistItem>
            ))}
          </PlaylistGrid>
        </div>
          </Container>
        );
    }
}

export default WebPlayback
