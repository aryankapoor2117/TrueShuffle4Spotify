import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';

const theme = {
  primary: '#53cbfb',
  secondary: '#cfcfcf',
  background: '#040404',
  playerBackground: '#1c1c1c',
  text: '#fff',
};

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&display=swap');

  body {
    font-family: 'Titillium Web', sans-serif;
    background-color: ${props => props.theme.background};
    color: ${props => props.theme.text};
  }
`;

const shuffleArray = (array) => {
    // Fisher-Yates shuffle algorithm
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  
  const addTracksToQueue = async (tracks, token) => {
    try {
      for (const track of tracks) {
        console.log(`Adding track to queue: ${track.name} (Tempo: ${track.tempo} BPM)`);
  
        await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(track.uri)}`, {
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
  
  const filterUniqueUris = async (uris, token) => {
    try {
      const queueResponse = await fetch('https://api.spotify.com/v1/me/player/queue', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const queueData = await queueResponse.json();
      const currentQueue = queueData.queue.map(item => item.uri);
  
      // Filter out duplicates
      const uniqueUris = uris.filter(uri => !currentQueue.includes(uri));
      return uniqueUris;
    } catch (error) {
      console.error('Error filtering unique URIs:', error);
      return uris;
    }
  };


  const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: 100vh;
`;

const PlayerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
  margin-bottom: 2rem;
  background-color: ${props => props.theme.playerBackground};
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const NowPlaying = styled.div`
  display: flex;
  align-items: center;
`;

const Cover = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1rem;
`;

const TrackInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const TrackName = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.primary};
`;

const ArtistName = styled.div`
  font-size: 1rem;
  color: ${props => props.theme.secondary};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled.button`
  background-color: ${props => props.theme.primary};
  border: none;
  color: ${props => props.theme.text};
  font-size: 1.2rem;
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.secondary};
  }
`;

const PlaylistsContainer = styled.div`
  width: 100%;
  max-width: 800px;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  background-color: #1c1c1c;
  color: #fff;
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
  padding: 1rem;
  background-color: #1c1c1c;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2c2c2c;
  }
`;

const PlaylistCover = styled.img`
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const PlaylistName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.primary};
`;

const TempoToggle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const TempoToggleLabel = styled.label`
  margin-left: 0.5rem;
  font-size: 1rem;
  color: #bdc3c7;
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
    const [sortByTempo, setSortByTempo] = useState(false);

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
            //addToQueue(1);
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

    const getPlaylistTracks = async (playlistId, token) => {
      try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        return data.items.map(item => item.track);
      } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        return [];
      }
    };

    const getTrackTempo = async (track) => {
      try {
        const response = await fetch(`https://api.spotify.com/v1/audio-features/${track.id}`, {
          headers: {
            'Authorization': `Bearer ${props.token}`
          }
        });
        const data = await response.json();
        let tempo = data.tempo;
    
        // Divide the tempo by 2 if it's above 180.00
        if (tempo > 180.00) {
          tempo /= 2;
        }
        else if(tempo <80.00)
        {
          tempo *= 2;
        }
    
        return tempo;
      } catch (error) {
        console.error('Error fetching audio features:', error);
        return 0;
      }
    };
    

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
      let tracks = await getPlaylistTracks(playlistId, props.token);
    
      if (sortByTempo) {
        const trackTempos = await Promise.all(
          tracks.map(async track => {
            const tempo = await getTrackTempo(track);
            return { ...track, tempo };
          })
        );
    
        trackTempos.sort((a, b) => b.tempo - a.tempo);
        await addTracksToQueue(trackTempos, props.token);
      } else {
        // Shuffle the tracks using the shuffleArray function
        tracks = shuffleArray(tracks);
        await addTracksToQueue(tracks, props.token);
      }
    };
    
  
    const filteredPlaylists = userPlaylists.filter(playlist =>
      playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
      <ThemeProvider theme={theme}>
        <Container>
          <GlobalStyle />
          {is_active ? (
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
          ) : null}
          <PlaylistsContainer>
            <SearchBar
              type="text"
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <TempoToggle>
              <input
                type="checkbox"
                checked={sortByTempo}
                onChange={() => setSortByTempo(!sortByTempo)}
              />
              <TempoToggleLabel>Sort by Tempo (Highest to Lowest)</TempoToggleLabel>
            </TempoToggle>
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
          </PlaylistsContainer>
        </Container>
      </ThemeProvider>
    );
  }

export default WebPlayback
