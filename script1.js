// Global constants for GitHub details
const username = "Justinas-Gibas"; // Replace with your GitHub username
const repo = "MyFistWebsite"; // Replace with your repository name
const branch = "ManoPirmasWebsaitas"; // Replace with your branch name

async function fetchFolderContents(path = "") {
  const apiURL = `https://api.github.com/repos/${username}/${repo}/contents/${path}?ref=${branch}`;

  const response = await fetch(apiURL);
  if (!response.ok) throw new Error("Failed to fetch repository data");
  return await response.json();
}

async function generateProjectTree(folder = "Deeper", parentElement = null) {
  try {
    const contents = await fetchFolderContents(folder);

    if (!Array.isArray(contents)) {
      console.error("Unexpected API Response:", contents);
      return;
    }

    const container = document.createElement("ul");
    container.style.listStyleType = "none";
    container.style.marginLeft = "20px";

    contents.forEach((item) => {
      const listItem = document.createElement("li");

      if (item.type === "dir") {
        // Handle subfolders
        const folderLabel = document.createElement("span");
        folderLabel.textContent = `📁 ${item.name}`;
        folderLabel.style.cursor = "pointer";
        folderLabel.onclick = () => {
          const sublist = listItem.querySelector("ul");
          if (sublist) sublist.style.display = sublist.style.display === "none" ? "block" : "none";
        };
        listItem.appendChild(folderLabel);

        generateProjectTree(`${folder}/${item.name}`, listItem);
      } else if (item.type === "file" && item.name.endsWith(".html")) {
        // Handle HTML files
        const fileLink = document.createElement("a");
        fileLink.href = `https://${username}.github.io/${repo}/${folder}/${item.name}`;
        fileLink.textContent = item.name.replace(".html", "");
        fileLink.target = "_blank";
        fileLink.style.color = "#00d9ff";
        listItem.appendChild(fileLink);
      }

      container.appendChild(listItem);
    });

    if (parentElement) {
      parentElement.appendChild(container);
    } else {
      document.getElementById("projects-section").appendChild(container);
    }
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
