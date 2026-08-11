// --- YouTube Configuration ---
const YOUTUBE_PLAYLIST_ID = "PLZDGO4vMh5jk";

// --- State ---
let ytPlayer;
let isPlaying = false;
let isPlayerReady = false;
let updateTimeInterval;

// --- DOM Elements ---
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
function init() {
    updateTime();
    setInterval(updateTime, 60000); // Update time every minute
    initParallax();
    initParticles();
    
    trackTitle.textContent = "Loading Playlist...";
    trackArtist.textContent = "Connecting to YouTube...";
}

// --- YouTube IFrame API ---
// This function is automatically called by the YouTube IFrame API script when it loads
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player', {
        height: '1',
        width: '1',
        playerVars: {
            listType: 'playlist',
            list: YOUTUBE_PLAYLIST_ID,
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    isPlayerReady = true;
    // Set initial volume
    ytPlayer.setVolume(volumeSlider.value);
    
    trackTitle.textContent = "Ready to Play";
    trackArtist.textContent = "Click Play to Start";
}

function onPlayerStateChange(event) {
    // When video starts playing (State 1)
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        playingBars.classList.add('active');
        playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; // Pause icon SVG
        
        // Start updating progress bar
        clearInterval(updateTimeInterval);
        updateTimeInterval = setInterval(updateProgressBar, 1000);
        
        // Extract metadata from the currently playing video
        const videoData = ytPlayer.getVideoData();
        updateUI(videoData);
        
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        isPlaying = false;
        playingBars.classList.remove('active');
        playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>'; // Play icon SVG
        clearInterval(updateTimeInterval);
        
    } else if (event.data === YT.PlayerState.UNSTARTED) {
        // Just loaded a new video
        const videoData = ytPlayer.getVideoData();
        if (videoData && videoData.title) {
            updateUI(videoData);
        }
    }
}

function onPlayerError(event) {
    console.error("YouTube Player Error:", event.data);
    trackTitle.textContent = "Error loading video";
    trackArtist.textContent = "Skipping to next...";
    // Automatically skip to the next video on error (e.g., if a video is deleted/private)
    setTimeout(() => ytPlayer.nextVideo(), 2000);
}

// --- UI Updates ---
function updateUI(videoData) {
    if (!videoData || !videoData.title) return;
    
    trackTitle.textContent = videoData.title;
    trackArtist.textContent = videoData.author;
    
    // Fetch high-quality thumbnail (hqdefault is incredibly reliable for all videos)
    const artworkUrl = `https://img.youtube.com/vi/${videoData.video_id}/hqdefault.jpg`;
    
    // Check if the artwork is actually different before fading to avoid flicker
    if (!trackArt.src.includes(videoData.video_id)) {
        trackArt.style.opacity = 0;
        setTimeout(() => {
            trackArt.src = artworkUrl;
            trackArt.style.opacity = 1;
        }, 300);
    }
}

function updateProgressBar() {
    if (!isPlayerReady || !isPlaying) return;
    
    const currentTime = ytPlayer.getCurrentTime() || 0;
    const duration = ytPlayer.getDuration() || 0;
    
    if (duration > 0) {
        const progressPercent = (currentTime / duration) * 100;
        progressFill.style.width = `${progressPercent}%`;
        currentTimeDisplay.textContent = formatTime(currentTime);
        durationDisplay.textContent = formatTime(duration);
    }
}

// --- Player Controls ---
function togglePlay() {
    if (!isPlayerReady) return;
    
    if (isPlaying) {
        ytPlayer.pauseVideo();
    } else {
        ytPlayer.playVideo();
    }
}

function nextTrack() {
    if (!isPlayerReady) return;
    ytPlayer.nextVideo();
}

function prevTrack() {
    if (!isPlayerReady) return;
    ytPlayer.previousVideo();
}

// --- Event Listeners ---
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

// Progress Bar Scrubbing
progressBg.addEventListener('click', (e) => {
    if (!isPlayerReady) return;
    
    const width = progressBg.clientWidth;
    const clickX = e.offsetX;
    const duration = ytPlayer.getDuration();
    
    if (duration > 0) {
        const seekTime = (clickX / width) * duration;
        ytPlayer.seekTo(seekTime, true);
    }
});

// Volume Control
volumeSlider.addEventListener('input', (e) => {
    if (isPlayerReady) {
        ytPlayer.setVolume(e.target.value);
    }
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
