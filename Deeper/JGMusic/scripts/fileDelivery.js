/**
 * @fileoverview Audio File Delivery System with Supabase Integration
 * @description Provides functionality to fetch, play, and comment on audio files
 * stored in Supabase buckets with lazy-loading and dynamic UI generation.
 * @author Justinas Gibas
 * @since 2025-07-16
 * @requires fetch API
 * @requires MOCK_DATA data
 * 
 */


/**
 * DOM element for bucket selection dropdown
 * @type {HTMLElement}
 */
const bucketSelect = document.getElementById('bucket');

/**
 * Event handler for fetching files from selected bucket
 * @async
 * @function fetchFilesHandler
 * @returns {Promise<void>}
 */
const fetchFilesHandler = async () => {
  const bucket = bucketSelect.value;
  fileList.innerHTML = "";
  
  try {
    console.log(`Fetching files from bucket: ${bucket}`);
    
    let result;
    // Use mock data in development mode
    if (DEV_MODE) {
      // Use mock data in development
      console.log('Using mock data for bucket:', bucket);
      result = {
        files: MOCK_DATA.files[bucket] || []
      };

    // API call in production
    } else {
      const response = await fetch(`https://haveno-vercel.vercel.app/api/list-files?bucket=${encodeURIComponent(bucket)}`);
      result = await response.json();
    }
    
    if (result.files && result.files.length > 0) {
      // Set up the playlist using listManager
      if (typeof setPlaylist === 'function') {
        setPlaylist(result.files, bucket);
      }
      
      result.files.reverse().forEach((file, index) => {
        const fileItem = createFileItem(file, bucket, index);
        fileList.appendChild(fileItem);
      });
    } else {
      fileList.innerHTML = "<li>No files found.</li>";
    }
  } catch (error) {
    console.error(`Error fetching files:`, error);
    fileList.innerHTML = "<li>Error fetching files.</li>";
  }
  
};

  /**
   * fetches  artwork for the current file
   * @async
   * @function fetchArtwork
   * @param {string} bucket - Bucket name
   * @param {string} file - File name
   * fileitem
   * @returns {Promise<string>} - Artwork URL
   *

async function fetchArtwork(bucket, file) {
  try {   
  const artworkUrl =
  `https://haveno-vercel.vercel.app/api/get-artwork?bucket=
  ${encodeURIComponent(bucket)}&file=${encodeURIComponent(file.name)}`;
  artwork.src = "../../upper/JG_favicon.ico"; // Default fallback

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
      } else {
        console.log(`[Comments] Production mode: Fetching from API`);
        const apiUrl = `https://haveno-vercel.vercel.app/api/get-comments?bucket=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file.name)}`;
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



  /**
   * Handles posting new comments
   * @async
   * @function postCommentHandler
   * @param {Event} event - Click event from post button
   * @returns {Promise<void>}
   */
  const postCommentHandler = async () => {
    const commentText = commentInput.value.trim();
    console.log(`[Comments] Attempting to post comment: "${commentText}"`);
    
    if (!commentText) {
      console.log(`[Comments] Empty comment text, aborting`);
      return;
    }

    try {

      if (DEV_MODE) {
        // Simulate posting comment in development
        console.log(`[Comments] DEV_MODE: Mock comment posted for ${file.name}:`, commentText);
        commentInput.value = "";
        
        // Add to mock data
        const key = `${bucket}/${file.name}`;
        console.log(`[Comments] Adding to mock data with key: ${key}`);
        
        if (!MOCK_DATA.comments[key]) {
          MOCK_DATA.comments[key] = [];
          console.log(`[Comments] Created new comment array for key: ${key}`);
        }
        
        MOCK_DATA.comments[key].push({ text: commentText });
        console.log(`[Comments] Updated mock data:`, MOCK_DATA.comments[key]);
        
        // Refresh comments display
        fetchComments();

        //
      } else {
        console.log(`[Comments] Production mode: Posting to API`);
        const apiUrl = `https://haveno-vercel.vercel.app/api/post-comment`;
        const payload = { bucket, file: file.name, text: commentText };
        
        console.log(`[Comments] API URL:`, apiUrl);
        console.log(`[Comments] Payload:`, payload);
        
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        console.log(`[Comments] API Response status:`, res.status);
        
        const result = await res.json();
        console.log(`[Comments] API Response:`, result);
        
        if (res.ok) {
          console.log(`[Comments] Comment posted successfully`);
          commentInput.value = "";
          fetchComments();
        } else {
          console.error(`[Comments] Error posting comment:`, result.error);
          alert("Error posting comment: " + (result.error || "Unknown error"));
        }
      }
    } catch (err) {
      console.error(`[Comments] Error posting comment:`, err);
      console.error(`[Comments] Error details:`, {
        message: err.message,
        stack: err.stack,
        bucket: bucket,
        fileName: file.name,
        commentText: commentText
      });
      alert("Error posting comment.");
    }
  };







