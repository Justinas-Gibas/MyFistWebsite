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
    
    // Build complete folder structure including all parent directories
    const folderStructure = {};
    const allFolders = new Set();
    
    htmlFiles.forEach(file => {
      const pathParts = file.path.split('/');
      const fileName = pathParts.pop();
      
      // Add all parent folders to the set
      for (let i = 1; i <= pathParts.length; i++) {
        const folderPath = pathParts.slice(0, i).join('/');
        allFolders.add(folderPath);
      }
      
      const folderPath = pathParts.join('/');
      if (!folderStructure[folderPath]) {
        folderStructure[folderPath] = [];
      }
      folderStructure[folderPath].push({ name: fileName, path: file.path });
    });
    
    // Create hierarchy structure
    const hierarchy = {};
    
    // Sort folders by depth and path
    const sortedFolders = Array.from(allFolders).sort((a, b) => {
      const depthA = a.split('/').length;
      const depthB = b.split('/').length;
      if (depthA !== depthB) return depthA - depthB;
      return a.localeCompare(b);
    });
    
    // Build nested structure
    sortedFolders.forEach(folderPath => {
      const pathParts = folderPath.split('/');
      const folderName = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join('/');
      
      if (!hierarchy[folderPath]) {
        hierarchy[folderPath] = {
          name: folderName,
          path: folderPath,
          children: [],
          files: folderStructure[folderPath] || []
        };
      }
      
      if (parentPath && hierarchy[parentPath]) {
        hierarchy[parentPath].children.push(hierarchy[folderPath]);
      }
    });
    
    const container = document.createElement("ul");
    container.style.listStyleType = "none";
    container.style.marginLeft = "20px";
    
    // Render hierarchy starting from root folders
    const rootFolders = sortedFolders.filter(path => path.split('/').length === 1);
    
    function renderFolder(folderData, depth = 0, isOpen = false) {
      const listItem = document.createElement("li");
      listItem.style.marginLeft = `${depth * 20}px`;
      
      // Create folder label
      const folderLabel = document.createElement("span");
      folderLabel.textContent = `📁 ${folderData.name}`;
      folderLabel.style.cursor = "pointer";
      folderLabel.style.fontWeight = "bold";
      folderLabel.style.display = "block";
      folderLabel.style.marginBottom = "5px";
      
      listItem.appendChild(folderLabel);
      
      // Create content container (files and subfolders)
      const contentContainer = document.createElement("ul");
      contentContainer.style.listStyleType = "none";
      contentContainer.style.marginLeft = "20px";
      contentContainer.style.display = isOpen ? "block" : "none"; // Open if specified
      
      // Add HTML files if any
      folderData.files.forEach(file => {
        const fileItem = document.createElement("li");
        const fileLink = document.createElement("a");
        fileLink.href = `https://${username}.github.io/${repo}/${file.path}`;
        fileLink.textContent = file.name.replace(".html", "");
        fileLink.target = "_blank";
        fileLink.style.color = "var(--primary-color)";
        fileLink.style.textDecoration = "none";
        fileItem.appendChild(fileLink);
        contentContainer.appendChild(fileItem);
      });
      
      // Add subfolders
      folderData.children.forEach(child => {
        const childElement = renderFolder(child, 0); // Reset depth for recursive calls
        contentContainer.appendChild(childElement);
      });
      
      // Toggle functionality
      folderLabel.onclick = () => {
        contentContainer.style.display = contentContainer.style.display === "none" ? "block" : "none";
      };
      
      listItem.appendChild(contentContainer);
      return listItem;
    }
    
    // Render root folders
    rootFolders.forEach(rootPath => {
      const rootFolder = hierarchy[rootPath];
      if (rootFolder) {
        // Open the "Deeper" folder by default
        const shouldOpen = rootFolder.name === "Deeper";
        container.appendChild(renderFolder(rootFolder, 0, shouldOpen));
      }
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
  header.style.color = "var(--secondary-color)";
  projectsSection.appendChild(header);

  generateProjectTree();
});
