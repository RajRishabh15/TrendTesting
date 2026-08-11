// The playlist data will now be fetched from the secure Vercel API route (/api/playlist)

// Placeholder audio URLs to use since full Spotify streaming requires Premium/OAuth
const placeholderAudio = [
    "assets/song1.mp3",
    "assets/song2.mp3",
    "assets/song3.mp3"
];

// --- State ---
let playlist = [];
let currentTrackIndex = 0;
let isPlaying = false;

// --- DOM Elements ---
const audioElement = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const playIcon = document.getElementById('play-icon');

const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const trackArt = document.getElementById('track-art');
const playingBars = document.getElementById('playing-bars');

const progressBg = document.getElementById('progress-bg');
const progressFill = document.getElementById('progress-fill');
const currentTimeDisplay = document.getElementById('current-time-display');
const durationDisplay = document.getElementById('duration-display');

const volumeSlider = document.getElementById('volume-slider');
const timeIndicator = document.getElementById('current-time');

// --- Initialization ---
async function init() {
    updateTime();
    setInterval(updateTime, 60000); // Update time every minute
    initParallax();
    initParticles();

    trackTitle.textContent = "Loading Playlist...";
    trackArtist.textContent = "Connecting to Spotify...";
    
    try {
        await fetchSpotifyPlaylist();
    } catch (error) {
        console.error("Error fetching Spotify playlist:", error);
        setupFallbackPlaylist();
    }

    if (playlist.length > 0) {
        loadTrack(currentTrackIndex);
    }
}

// --- Spotify API Logic ---
async function fetchSpotifyPlaylist() {
    // Fetch from our secure Vercel Serverless Function
    const response = await fetch('/api/playlist');
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch playlist from API");
    }
    
    const playlistData = await response.json();

    // Map to our custom playlist structure
    playlist = playlistData.items.filter(item => item.track).map((item, index) => {
        const track = item.track;
        // Cycle through placeholder audio
        const audioSrc = placeholderAudio[index % placeholderAudio.length];
        
        return {
            title: track.name,
            artist: track.artists.map(a => a.name).join(", "),
            audio: audioSrc,
            artwork: track.album.images[0]?.url || 'assets/album_art_1.png'
        };
    });
}

function setupFallbackPlaylist() {
    // Fallback if credentials are missing or API fails
    playlist = [
        {
            title: "Waiting for Spotify Key",
            artist: "Add your API credentials",
            audio: placeholderAudio[0],
            artwork: "assets/album_art_1.png"
        },
        {
            title: "Yamuna Aarti (Placeholder)",
            artist: "Devotional Instrumental",
            audio: placeholderAudio[1],
            artwork: "assets/album_art_2.png"
        }
    ];
}

// --- Audio Player Logic ---
function loadTrack(index) {
    if (playlist.length === 0) return;
    
    const track = playlist[index];
    audioElement.src = track.audio;
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    
    // Add a subtle fade animation when changing art
    trackArt.style.opacity = 0;
    setTimeout(() => {
        trackArt.src = track.artwork;
        trackArt.style.opacity = 1;
    }, 300); // Wait for fade out to complete before swapping src
}

function playTrack() {
    if (playlist.length === 0) return;
    audioElement.play();
    isPlaying = true;
    playingBars.classList.add('active');
    playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; // Pause icon SVG
}

function pauseTrack() {
    audioElement.pause();
    isPlaying = false;
    playingBars.classList.remove('active');
    playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>'; // Play icon SVG
}

function togglePlay() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

function nextTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) playTrack();
}

function prevTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) playTrack();
}

// --- Event Listeners ---
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

// Audio Events
audioElement.addEventListener('ended', nextTrack);

audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration) {
        const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
        progressFill.style.width = `${progressPercent}%`;
        currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
    }
});

audioElement.addEventListener('loadedmetadata', () => {
    durationDisplay.textContent = formatTime(audioElement.duration);
});

// Progress Bar Scrubbing
progressBg.addEventListener('click', (e) => {
    const width = progressBg.clientWidth;
    const clickX = e.offsetX;
    const duration = audioElement.duration;
    if (duration) {
        audioElement.currentTime = (clickX / width) * duration;
    }
});

// Volume Control
volumeSlider.addEventListener('input', (e) => {
    audioElement.volume = e.target.value / 100;
});

// --- Utility Functions ---
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    timeIndicator.textContent = `${hours}:${minutesStr} ${ampm}`;
}

// --- Visual Effects ---
// Parallax Background
function initParallax() {
    const bg = document.getElementById('parallax-bg');
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth - e.pageX * 2) / 90;
        const y = (window.innerHeight - e.pageY * 2) / 90;
        bg.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
    });
}

// Floating Particles (Fireflies)
function initParticles() {
    const container = document.getElementById('particles-container');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Randomize properties
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = Math.random() * 10 + 10;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}vw`;
        particle.style.animationDelay = `${delay}s, ${Math.random() * 2}s`;
        particle.style.animationDuration = `${duration}s, 3s`;

        container.appendChild(particle);
    }
}

// Start everything
window.addEventListener('DOMContentLoaded', init);
