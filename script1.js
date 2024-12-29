
async function loadProjects() {
    const username = 'Justinas-Gibas'; // Your GitHub username
    const repo = 'MyFistWebsite';     // Your repository name
    const branch = 'ManoPirmasWebsaitas'; // Your branch name
    const folder = 'Deeper';          // Folder to fetch files from
    const apiURL = `https://api.github.com/repos/${username}/${repo}/contents/${folder}?ref=${branch}`;
  
    try {
      const response = await fetch(apiURL);
      if (!response.ok) throw new Error('Failed to fetch repository data');
      const files = await response.json();
  
      const projectContainer = document.querySelector('#work .container');
      files.forEach(file => {
        if (file.type === 'file' && file.name.endsWith('.html')) {
          const figure = document.createElement('figure');
          figure.className = 'work-item';
  
          const link = document.createElement('a');
          link.href = `https://${username}.github.io/${repo}/${folder}/${file.name}`;
          link.target = '_self';
          link.className = 'contact-item__link';
          link.textContent = file.name.replace('.html', '');
  
          const caption = document.createElement('figcaption');
          caption.className = 'work-item__caption';
          caption.textContent = `${file.name.replace('.html', '')} project`;
  
          figure.appendChild(link);
          figure.appendChild(caption);
          projectContainer.appendChild(figure);
        }
      });
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }
  
  // Call the function after the DOM is loaded
  document.addEventListener('DOMContentLoaded', loadProjects);
  