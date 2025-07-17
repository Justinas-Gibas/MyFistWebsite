/**
 * @fileoverview List Manager Script
 * @description Manages ui elements for audio files, including lazy-loading, dynamic UI generation,
 * and integration with the main audio player.
 * @author Justinas Gibas
 * @since 2025-07-16
 * @requires DOM manipulation
 * @requires Audio API
 * @requires Event handling
 * @requires fileDelivery functions
 */


/**
 * DOM element for file list container
 * @type {HTMLElement}
 */
const fileList = document.getElementById('file-list');

/**
 * fetch files on page load
 * event listener for bucket change
 *
 *  */ 
document.addEventListener('DOMContentLoaded', () => {
  // Auto-fetch files when bucket changes
  bucketSelect.addEventListener('change', fetchFilesHandler);
  
  // Auto-fetch files on page load
  fetchFilesHandler();
});

/**
 * Creates a file items  element with audio player and comments functionality
 * @function createFileItem
 * @param {Object} file - File object from Supabase
 * @param {string} file.name - Name of the file
 * @param {string} bucket - Bucket name where the file is stored
 * @param {number} index - Index of the file in the list
 * @returns {HTMLLIElement} Complete file item DOM element
 * @throws {Error} Throws error if file object is invalid
 * @example
 * const fileObj = { name: "song.mp3" };
 * const listItem = createFileItem(fileObj, "music-bucket", 0);
 * document.getElementById('file-list').appendChild(listItem);
 */
function createFileItem(file, bucket, index) {
  // Validate input parameters
  if (!file || !file.name || !bucket) {
    throw new Error('Invalid file object or bucket name');
  }

  //console.log(`[FileItem] Creating file item for: ${file.name} in bucket: ${bucket} at index: ${index}`);

  /**
   * Main list item container
   * @type {HTMLLIElement}
   */
  const li = document.createElement('li');
  li.className = "file-item";

  // Create card header with artwork
  const cardHeader = document.createElement('div');
  cardHeader.className = "file-card-header";

  // Create artwork image element
  const artwork = document.createElement('img');
  artwork.className = "file-artwork";
  artwork.alt = file.name;
  artwork.src = file.artwork || "../../upper/JG_favicon.ico";

  const playOverlay = document.createElement('div');
  playOverlay.className = "play-overlay";

  const playBtn = document.createElement('button');
  playBtn.className = "play-btn";
  playBtn.textContent = "Play ▶";

  playOverlay.appendChild(playBtn);
  cardHeader.appendChild(artwork);
  cardHeader.appendChild(playOverlay);

  // Create card content
  const cardContent = document.createElement('div');
  cardContent.className = "file-card-content";

  /**
   * File name display element
   * @type {HTMLDivElement}
   */
  const fileNameEl = document.createElement('div');
  fileNameEl.className = "file-name";
  fileNameEl.textContent = file.name.replace(/\.[^/.]+$/, ""); // Remove extension for display

  const fileInfo = document.createElement('div');
  fileInfo.className = "file-info";
  
  const fileType = document.createElement('span');
  fileType.textContent = file.name.split('.').pop().toUpperCase();
  
  const fileDuration = document.createElement('span');
  fileDuration.className = "file-duration";
  fileDuration.textContent = "--:--";

  // Asynchronously fetch and display the audio duration
  const setAudioDuration = () => {
    const audio = new Audio();
    let audioUrl;

    // Determine the correct URL based on the mode
    if (window.DEV_MODE) {
        const mockKey = `${bucket}/${file.name}`;
        audioUrl = MOCK_DATA.audioUrls[mockKey] || `../lib/images/004_1.WAV`;
    } else {
        audioUrl = `https://haveno-vercel.vercel.app/api/get-file?bucket=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file.name)}`;
    }
    
    audio.src = audioUrl;

    // When the metadata is loaded, update the duration text
    audio.addEventListener('loadedmetadata', () => {
      if (isFinite(audio.duration)) {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60).toString().padStart(2, '0');
        fileDuration.textContent = `${minutes}:${seconds}`;
      }
    });

    // Handle cases where the audio file might not load
    audio.addEventListener('error', () => {
        fileDuration.textContent = "N/A";
        console.error(`[Duration] Failed to load metadata for: ${file.name}`);
    });
  };

  setAudioDuration();

  fileInfo.appendChild(fileType);
  fileInfo.appendChild(fileDuration);

  cardContent.appendChild(fileNameEl);
  cardContent.appendChild(fileInfo);

  /**
   * Comments section container
   * @type {HTMLDivElement}
   */
  const commentsSection = document.createElement('div');
  commentsSection.className = "comments-section";
  commentsSection.innerHTML = `
    <strong>Comments:</strong>
    <div class="comments-list"><em>Loading comments...</em></div>
    <input type="text" class="comment-input" placeholder="Add a comment...">
    <button class="post-comment-btn">Post Comment</button>
  `;
  cardContent.appendChild(commentsSection);

  li.appendChild(cardHeader);
  li.appendChild(cardContent);

  // Get comment elements
  const commentsList = commentsSection.querySelector('.comments-list');
  const commentInput = commentsSection.querySelector('.comment-input');
  const postCommentBtn = commentsSection.querySelector('.post-comment-btn');

  /**
   * Fetches and displays comments for the current file
   * @async
   * @function fetchComments
   * @returns {Promise<void>}
   * @throws {Error} Network or parsing errors
   */
  async function fetchComments() {
    console.log(`[Comments] Fetching comments for file: ${file.name} in bucket: ${bucket}`);
    
    try {
      let data;
      if (DEV_MODE) {
        // Use mock data in development
        const key = `${bucket}/${file.name}`;
        console.log(`[Comments] DEV_MODE: Using mock data for key: ${key}`);
        console.log(`[Comments] Available mock comment keys:`, Object.keys(MOCK_DATA.comments));
        
        data = {
          comments: MOCK_DATA.comments[key] || []
        };
        console.log(`[Comments] Mock data retrieved:`, data);

        // production mode
      } else {
        console.log(`[Comments] Production mode: Fetching from API`);
        const apiUrl = `https://haveno-vercel.app/api/get-comments?bucket=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file.name)}`;
        console.log(`[Comments] API URL:`, apiUrl);
        
        const res = await fetch(apiUrl);
        console.log(`[Comments] API Response status:`, res.status);
        
        data = await res.json();
        console.log(`[Comments] API Response data:`, data);
      }
      
      console.log(`[Comments] Processing comments data:`, data);
      commentsList.innerHTML = "";
      
      if (data.comments && data.comments.length > 0) {
        console.log(`[Comments] Found ${data.comments.length} comments`);
        data.comments.forEach((comment, index) => {
          console.log(`[Comments] Processing comment ${index}:`, comment);
          const commentEl = document.createElement('div');
          commentEl.className = "comment";
          commentEl.textContent = comment.text;
          commentsList.appendChild(commentEl);
        });
      } else {
        console.log(`[Comments] No comments found for ${file.name}`);
        commentsList.innerHTML = "<em>No comments yet.</em>";
      }
      
      console.log(`[Comments] Comments loaded successfully for ${file.name}`);
    } catch (err) {
      console.error(`[Comments] Error loading comments for ${file.name}:`, err);
      console.error(`[Comments] Error details:`, {
        message: err.message,
        stack: err.stack,
        bucket: bucket,
        fileName: file.name
      });
      commentsList.innerHTML = "<em>Error loading comments.</em>";
    }
  }

  // Initialize comments
  console.log(`[FileItem] Initializing comments for ${file.name}`);
  fetchComments();

  /**
   * Handles posting new comments
   * @async
   * @function postCommentHandler
   * @returns {Promise<void>}
   */
  const postCommentHandler = async () => {
    const commentText = commentInput.value.trim();
    
    if (!commentText) return;

    try {
      if (DEV_MODE) {
        // Add to mock data
        const key = `${bucket}/${file.name}`;
        if (!MOCK_DATA.comments[key]) {
          MOCK_DATA.comments[key] = [];
        }
        MOCK_DATA.comments[key].push({ text: commentText });
        commentInput.value = "";
        fetchComments();
        // development mode
      } else {
        // Production API call
        const res = await fetch(`https://haveno-vercel.app/api/post-comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket, file: file.name, text: commentText })
        });
        
        if (res.ok) {
          commentInput.value = "";
          fetchComments();
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  // Add event listener for post comment button
  postCommentBtn.addEventListener('click', postCommentHandler);
  
  /**
   * Handles play button click - integrates with main audio player
   * @function playButtonHandler
   * @returns {void}
  */
 const playButtonHandler = () => {
     let fileUrl;
     let trackToPlay;
     
     if (DEV_MODE) {
         // Use mock audio URLs instead of mock references
         const mockKey = `${bucket}/${file.name}`;
         fileUrl = MOCK_DATA.audioUrls[mockKey] || `../../lib/audio/004_1.WAV`;
         trackToPlay = { url: fileUrl, name: file.name, bucket: bucket };
        } else {
            // ask fileDelivery for the file URL
            fileUrl = `https://haveno-vercel.vercel.app/api/get-file?bucket=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file.name)}`;
        }
        // Set the current track index for the main player
        if (typeof setCurrentTrackIndex === 'function') {
            setCurrentTrackIndex(index);
        }
        
        // Play in main audio player
        if (typeof playAudio === 'function') {
            playAudio(fileUrl, file.name, bucket);
        } else {
            console.error('Main audio player not available');
        }
    };
    
    playBtn.addEventListener('click', playButtonHandler);
    
    return li;
}




// Playlist management
let currentPlaylist = [];
let currentTrackIndex = 0;
let currentBucket = '';

/**
 * Sets the current playlist
 * @function setPlaylist
 * @param {Array} files - Array of file objects
 * @param {string} bucket - Bucket name
 */
function setPlaylist(files, bucket) {
  currentPlaylist = files;
  currentBucket = bucket;
  console.log(`[AudioPlayer] Playlist set with ${files.length} tracks`);
}

/**
 * Sets the current track index
 * @function setCurrentTrackIndex
 * @param {number} index - Track index
 */
function setCurrentTrackIndex(index) {
  currentTrackIndex = index;
  console.log(`[AudioPlayer] Current track index set to: ${index}`);
}

/**
 * Gets the next track
 * @function nextTrack
 * @returns {Object|null} Next track object or null
 */
function nextTrack() {
  if (currentTrackIndex < currentPlaylist.length - 1) {
    currentTrackIndex++;
    const file = currentPlaylist[currentTrackIndex];
    const fileUrl = DEV_MODE ? 
      `#mock-${file.name}` : 
      `https://haveno-vercel.app/api/get-file?bucket=${encodeURIComponent(currentBucket)}&file=${encodeURIComponent(file.name)}`;
    
    return {
      url: fileUrl,
      name: file.name,
      bucket: currentBucket
    };
  }
  return null;
}

/**
 * Gets the previous track
 * @function previousTrack
 * @returns {Object|null} Previous track object or null
 */
function previousTrack() {
  if (currentTrackIndex > 0) {
    currentTrackIndex--;
    const file = currentPlaylist[currentTrackIndex];
    const fileUrl = DEV_MODE ? 
      `#mock-${file.name}` : 
      `https://haveno-vercel.app/api/get-file?bucket=${encodeURIComponent(currentBucket)}&file=${encodeURIComponent(file.name)}`;
    
    return {
      url: fileUrl,
      name: file.name,
      bucket: currentBucket
    };
  }
  return null;
}

/**
 * Prepares the next track for lazy loading
 * lazy load data file for next track
 * @function prepareNextTrack
 * 
 */
