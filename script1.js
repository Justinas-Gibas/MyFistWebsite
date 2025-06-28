// Global constants for GitHub details
const username = "Justinas-Gibas"; // Replace with your GitHub username
const repo = "MyFistWebsite"; // Replace with your repository name
const branch = "ManoKumscioWebsaitas"; // Replace with your branch name

async function fetchAllFiles() {
  const apiURL = `https://api.github.com/repos/${username}/${repo}/git/trees/${branch}?recursive=1`;
  
  const response = await fetch(apiURL);
  if (!response.ok) throw new Error("Failed to fetch repository tree");
  return await response.json();
}

async function generateProjectTree() {
  try {
    const treeData = await fetchAllFiles();
    
    // Filter for HTML files in the "Deeper" folder
    const htmlFiles = treeData.tree.filter(item => 
      item.path.startsWith("Deeper/") && 
      item.type === "blob" && 
      item.path.endsWith(".html")
    );
    
    // Build folder structure
    const folderStructure = {};
    
    htmlFiles.forEach(file => {
      const pathParts = file.path.split('/');
      const fileName = pathParts.pop();
      const folderPath = pathParts.join('/');
      
      if (!folderStructure[folderPath]) {
        folderStructure[folderPath] = [];
      }
      folderStructure[folderPath].push({ name: fileName, path: file.path });
    });
    
    const container = document.createElement("ul");
    container.style.listStyleType = "none";
    container.style.marginLeft = "20px";
    
    // Sort folders to maintain hierarchy
    const sortedFolders = Object.keys(folderStructure).sort();
    
    sortedFolders.forEach(folderPath => {
      const pathParts = folderPath.split('/');
      const folderName = pathParts[pathParts.length - 1];
      const depth = pathParts.length - 1; // Deeper = 0, subfolder = 1, etc.
      
      const listItem = document.createElement("li");
      listItem.style.marginLeft = `${depth * 20}px`;
      
      // Create folder label
      const folderLabel = document.createElement("span");
      folderLabel.textContent = `📁 ${folderName}`;
      folderLabel.style.cursor = "pointer";
      folderLabel.style.fontWeight = "bold";
      folderLabel.style.display = "block";
      folderLabel.style.marginBottom = "5px";
      
      listItem.appendChild(folderLabel);
      
      // Create files container
      const filesContainer = document.createElement("ul");
      filesContainer.style.listStyleType = "none";
      filesContainer.style.marginLeft = "20px";
      filesContainer.style.display = "none"; // Hidden by default
      
      // Add HTML files
      folderStructure[folderPath].forEach(file => {
        const fileItem = document.createElement("li");
        const fileLink = document.createElement("a");
        fileLink.href = `https://${username}.github.io/${repo}/${file.path}`;
        fileLink.textContent = file.name.replace(".html", "");
        fileLink.target = "_blank";
        fileLink.style.color = "#00d9ff";
        fileLink.style.textDecoration = "none";
        fileItem.appendChild(fileLink);
        filesContainer.appendChild(fileItem);
      });
      
      // Toggle functionality
      folderLabel.onclick = () => {
        filesContainer.style.display = filesContainer.style.display === "none" ? "block" : "none";
      };
      
      listItem.appendChild(filesContainer);
      container.appendChild(listItem);
    });
    
    document.getElementById("projects-section").appendChild(container);
    
  } catch (error) {
    console.error("Error loading project tree:", error.message);
  }
}

// Call the function on page load
document.addEventListener("DOMContentLoaded", () => {
  const projectsSection = document.getElementById("projects-section");
  const header = document.createElement("h3");
  header.textContent = "Project Tree";
  header.style.color = "#ff4081";
  projectsSection.appendChild(header);

  generateProjectTree();
});
