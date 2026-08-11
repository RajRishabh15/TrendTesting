// --- YouTube Configuration ---
const YOUTUBE_PLAYLIST_ID = "PLZDGO4vMh5jk";

// --- State ---
let ytPlayer;
let isPlaying = false;
let isPlayerReady = false;
let animationFrameId;

// --- DOM Elements ---
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const playIcon = document.getElementById('play-icon');

const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const trackInfoInner = document.getElementById('track-info-inner');
const trackArt = document.getElementById('track-art');
const playingBars = document.getElementById('playing-bars');

const progressBg = document.getElementById('progress-bg');
const progressFill = document.getElementById('progress-fill');
const currentTimeDisplay = document.getElementById('current-time-display');
const durationDisplay = document.getElementById('duration-display');

const volumeSlider = document.getElementById('volume-slider');
const timeIndicator = document.getElementById('current-time');

// Sidebar Elements
const playlistToggleBtn = document.getElementById('playlist-toggle-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const playlistSidebar = document.getElementById('playlist-sidebar');
const sidebarList = document.getElementById('sidebar-list');

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
    ytPlayer.setVolume(volumeSlider.value);
    
    trackTitle.textContent = "Ready to Play";
    trackArtist.textContent = "Click Play to Start";
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        playingBars.classList.add('active');
        playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; // Pause icon
        
        // Start live synced progress bar
        cancelAnimationFrame(animationFrameId);
        updateProgressBar();
        
        const videoData = ytPlayer.getVideoData();
        updateUI(videoData);
        populateSidebar(); // Update active state in sidebar
        
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        isPlaying = false;
        playingBars.classList.remove('active');
        playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>'; // Play icon
        cancelAnimationFrame(animationFrameId);
        
    } else if (event.data === YT.PlayerState.UNSTARTED || event.data === YT.PlayerState.CUED) {
        const videoData = ytPlayer.getVideoData();
        if (videoData && videoData.title) {
            updateUI(videoData);
        }
        populateSidebar(); // Build sidebar if not built yet
    }
}

function onPlayerError(event) {
    console.error("YouTube Player Error:", event.data);
    trackTitle.textContent = "Skipped (Embed Restricted)";
    trackArtist.textContent = "Copyright owner blocked embeds";
    // Automatically skip to the next video after showing the message
    setTimeout(() => ytPlayer.nextVideo(), 2500);
}

// --- UI Updates ---
function updateUI(videoData) {
    if (!videoData || !videoData.title) return;
    
    // Smooth translation effect for text
    trackInfoInner.style.transform = 'translateY(10px)';
    trackInfoInner.style.opacity = '0';
    
    setTimeout(() => {
        trackTitle.textContent = videoData.title;
        trackArtist.textContent = videoData.author;
        trackInfoInner.style.transform = 'translateY(0)';
        trackInfoInner.style.opacity = '1';
    }, 200);
    
    const artworkUrl = `https://img.youtube.com/vi/${videoData.video_id}/hqdefault.jpg`;
    
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
    
    // Live perfectly smooth sync using requestAnimationFrame
    animationFrameId = requestAnimationFrame(updateProgressBar);
}

// --- Playlist Sidebar Logic ---
function toggleSidebar() {
    playlistSidebar.classList.toggle('open');
}

playlistToggleBtn.addEventListener('click', toggleSidebar);
closeSidebarBtn.addEventListener('click', toggleSidebar);

function populateSidebar() {
    if (!isPlayerReady) return;
    
    const playlistIds = ytPlayer.getPlaylist();
    if (!playlistIds || playlistIds.length === 0) return;
    
    const currentIndex = ytPlayer.getPlaylistIndex();
    
    // If we already built the list, just update the active class for performance
    if (sidebarList.children.length === playlistIds.length) {
        Array.from(sidebarList.children).forEach((item, idx) => {
            item.classList.toggle('active', idx === currentIndex);
        });
        return;
    }
    
    // Build the list initially
    sidebarList.innerHTML = '';
    playlistIds.forEach((id, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${index === currentIndex ? 'active' : ''}`;
        
        // Image Container
        const imgContainer = document.createElement('div');
        imgContainer.className = 'playlist-item-img';
        const img = document.createElement('img');
        img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        img.alt = `Track ${index + 1}`;
        imgContainer.appendChild(img);
        
        // Info Container (Title)
        const infoContainer = document.createElement('div');
        infoContainer.className = 'playlist-item-info';
        const titleEl = document.createElement('div');
        titleEl.className = 'playlist-item-title';
        titleEl.textContent = `Loading track ${index + 1}...`; // Placeholder
        infoContainer.appendChild(titleEl);
        
        item.appendChild(imgContainer);
        item.appendChild(infoContainer);
        
        item.addEventListener('click', () => {
            ytPlayer.playVideoAt(index);
            if (window.innerWidth < 900) toggleSidebar(); // Close on mobile after selection
        });
        
        sidebarList.appendChild(item);
        
        // Asynchronously fetch the actual YouTube video title without an API key!
        fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.title) {
                    titleEl.textContent = data.title;
                } else {
                    titleEl.textContent = `Track ${index + 1}`;
                }
            })
            .catch(() => {
                titleEl.textContent = `Track ${index + 1}`;
            });
    });
}

// --- Player Controls ---
playBtn.addEventListener('click', () => {
    if (!isPlayerReady) return;
    if (isPlaying) ytPlayer.pauseVideo();
    else ytPlayer.playVideo();
});

nextBtn.addEventListener('click', () => isPlayerReady && ytPlayer.nextVideo());
prevBtn.addEventListener('click', () => isPlayerReady && ytPlayer.previousVideo());

// Live smooth seeking logic
let isDragging = false;

progressBg.addEventListener('mousedown', (e) => {
    isDragging = true;
    seekToMouse(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) seekToMouse(e);
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

function seekToMouse(e) {
    if (!isPlayerReady) return;
    const rect = progressBg.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width)); // Clamp between 0 and width
    
    const duration = ytPlayer.getDuration();
    if (duration > 0) {
        const seekTime = (x / rect.width) * duration;
        progressFill.style.width = `${(x / rect.width) * 100}%`;
        currentTimeDisplay.textContent = formatTime(seekTime);
        
        // Only actually tell YouTube to seek if we're not constantly firing
        // For perfectly smooth feel, we seek instantly here.
        ytPlayer.seekTo(seekTime, true);
    }
}

// Volume Control
volumeSlider.addEventListener('input', (e) => isPlayerReady && ytPlayer.setVolume(e.target.value));

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
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    timeIndicator.textContent = `${hours}:${minutesStr} ${ampm}`;
}

// --- Visual Effects ---
function initParallax() {
    const bg = document.getElementById('parallax-bg');
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth - e.pageX * 2) / 90;
        const y = (window.innerHeight - e.pageY * 2) / 90;
        bg.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
    });
}

function initParticles() {
    const container = document.getElementById('particles-container');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
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

window.addEventListener('DOMContentLoaded', init);
