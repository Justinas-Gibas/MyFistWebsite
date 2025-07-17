/**
 * @fileoverview Mock Data for Development Environment
 * @description Provides fake data to simulate Vercel API responses
 * @author Justinas Gibas
 * @since 2025-07-16
 * 
 */

const MOCK_DATA = {
  files: {
    jgmusic: [
      { name: "song1.mp3" },
      { name: "track2.mp3" },
      { name: "beat3.mp3" },
      { name: "melody4.mp3" },
      { name: "composition5.mp3" },
      { name: "004_1.WAV" }  // Added WAV file
    ],
    drafts: [
      { name: "draft1.mp3" },
      { name: "idea2.mp3" },
      { name: "sketch3.mp3" }
    ]
  },
  
  // Mock audio URLs - map file names to actual audio sources
  audioUrls: {
    "jgmusic/004_1.WAV": "../lib/images/004_1.WAV",  // Path to your actual WAV file
    "jgmusic/song1.mp3": "",
    "jgmusic/track2.mp3": "",
    "jgmusic/beat3.mp3": "",
    "jgmusic/melody4.mp3": "",
    "jgmusic/composition5.mp3": "",
    "drafts/draft1.mp3": "",
    "drafts/idea2.mp3": "",
    "drafts/sketch3.mp3": ""
  },

  comments: {
    "jgmusic/song1.mp3": [
      { text: "Great track! Love the melody." },
      { text: "The beat is amazing!" },
      { text: "Perfect for my playlist." }
    ],
    "jgmusic/track2.mp3": [
      { text: "Nice composition." }
    ],
    "jgmusic/004_1.WAV": [
      { text: "Interesting WAV file!" },
      { text: "Good quality audio - love the clarity!" },
      { text: "Great work on this track!" }
    ],
    "drafts/draft1.mp3": [
      { text: "Interesting idea, keep working on it." }
    ]
  }
};

/**
 * Mock function to simulate getting file URL
 * @param {string} bucket - Bucket name
 * @param {string} fileName - File name
 * @returns {string} Mock audio URL
 */
function getMockAudioUrl(bucket, fileName) {
  const key = `${bucket}/${fileName}`;
  return MOCK_DATA.audioUrls[key]
}

console.log('[Mock] Mock data loaded:', MOCK_DATA);
//console.log('[Mock] Available comment keys:', Object.keys(MOCK_DATA.comments));
