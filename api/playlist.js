export default async function handler(req, res) {
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "ec3ff927646047ff8513827c9d5e9f7f";
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "50d5ab4f45de49c097eb9166a518940a";
    const SPOTIFY_PLAYLIST_ID = "0N1ykhK4tlemvHW0UU44H6";

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        return res.status(500).json({ error: "Missing Spotify credentials in Vercel Environment Variables" });
    }

    try {
        // 1. Get Access Token (Client Credentials Flow)
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
            throw new Error("Failed to authenticate with Spotify API");
        }
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Fetch Playlist Data
        const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${SPOTIFY_PLAYLIST_ID}/tracks?limit=50`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!playlistResponse.ok) {
            throw new Error("Failed to fetch playlist from Spotify");
        }
        
        const playlistData = await playlistResponse.json();
        
        // Ensure CORS headers are set if needed, though Vercel handles this for same-origin by default
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(playlistData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
