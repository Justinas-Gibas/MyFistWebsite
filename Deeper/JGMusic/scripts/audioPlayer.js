/**
 * @fileoverview Audio Player Script
 * @description Provides functionality to control audio playback, display track information,
 * @author Justinas Gibas
 * @since 2025-07-16
 * @requires DOM manipulation
 * @requires Audio API
 * @requires Event handling
 * @requires listManager functions
 */


// Get DOM elements
const audioElement = document.getElementById('mainAudio');
const playPauseBtn = document.getElementById('playPause');
const previousBtn = document.getElementById('previous');
const nextBtn = document.getElementById('next');
const trackTitleEl = document.getElementById('trackTitle');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const timeSlider = document.getElementById('timeSlider');
const artworkImage = document.getElementById('artworkImage');

/**
 * Plays the selected audio track
 * @function playAudio
 * @param {string} trackUrl - URL of the audio track to play
 * @param {string} trackName - Name of the track
 * @param {string} bucket - Bucket name
 */
function playAudio(trackUrl, trackName = 'Unknown Track', bucket = '') {
  audioElement.src = trackUrl;
  trackTitleEl.textContent = trackName;
  
  audioElement.play().then(() => {
    playPauseBtn.textContent = 'Pause';
  }).catch(err => {
    console.error('Play error:', err);
    // Fallback to error sound
    audioElement.src = "../lib/images/004_1.WAV"; // Path to your actual WAV file
    audioElement.play();
  });
}

/**
 * Pauses the currently playing audio track
 * @function pauseAudio
 */
function pauseAudio() {
  audioElement.pause();
  playPauseBtn.textContent = 'Play';
}

/**
 * Stops the currently playing audio track
 * @function stopAudio
 */
function stopAudio() {
  audioElement.pause();
  audioElement.currentTime = 0;
  playPauseBtn.textContent = 'Play';
}

/**
 * Toggles play/pause state
 * @function togglePlayPause
 */
function togglePlayPause() {
  if (audioElement.paused) {
    audioElement.play().then(() => {
      playPauseBtn.textContent = 'Pause';
    }).catch(err => {
      console.error('Play error:', err);
    });
  } else {
    pauseAudio();
  }
}

/**
 * Formats time in MM:SS format
 * @function formatTime
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Updates the time display and slider
 * @function updateTimeDisplay
 */
function updateTimeDisplay() {
  const currentTime = audioElement.currentTime;
  const duration = audioElement.duration;
  
  currentTimeEl.textContent = formatTime(currentTime);
  durationEl.textContent = formatTime(duration || 0);
  
  if (duration) {
    timeSlider.value = (currentTime / duration) * 100;
  }
}

/**
 * Plays next track in playlist
 * @function playNext
 */
function playNext() {
  const track = nextTrack();
  if (track) {
    playAudio(track.url, track.name, track.bucket);
  }
}

/**
 * Plays previous track in playlist
 * @function playPrevious
 */
function playPrevious() {
  const track = previousTrack();
  if (track) {
    playAudio(track.url, track.name, track.bucket);
  }
}

// Event listeners
if (playPauseBtn) {
  playPauseBtn.addEventListener('click', togglePlayPause);
}

if (previousBtn) {
  previousBtn.addEventListener('click', playPrevious);
}

if (nextBtn) {
  nextBtn.addEventListener('click', playNext);
}

if (timeSlider) {
  timeSlider.addEventListener('input', () => {
    const duration = audioElement.duration;
    if (duration) {
      audioElement.currentTime = (timeSlider.value / 100) * duration;
    }
  });
}

// Audio element event listeners
if (audioElement) {
  audioElement.addEventListener('timeupdate', updateTimeDisplay);
  audioElement.addEventListener('loadedmetadata', updateTimeDisplay);
  audioElement.addEventListener('ended', playNext);
  
  audioElement.addEventListener('play', () => {
    playPauseBtn.textContent = 'Pause';
  });
  
  audioElement.addEventListener('pause', () => {
    playPauseBtn.textContent = 'Play';
  });
}

// keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields
  
  switch(e.key) {
    case ' ':
      e.preventDefault();
      if (typeof togglePlayPause === 'function') {
        togglePlayPause();
      }
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (typeof playPrevious === 'function') {
        playPrevious();
      }
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (typeof playNext === 'function') {
        playNext();
      }
      break;
  }
});
