<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MetaMask Connect</title>
</head>
<body>
  <button id="connectButton">Connect MetaMask</button>
  <p id="status"></p>

  <script>
    const connectButton = document.getElementById('connectButton');
    const status = document.getElementById('status');

    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
      status.textContent = 'MetaMask is available!';
      
      connectButton.addEventListener('click', async () => {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          status.textContent = `Connected: ${accounts[0]}`;
        } catch (error) {
          status.textContent = `Error: ${error.message}`;
        }
      });
    } else {
      status.textContent = 'MetaMask is not installed. Please install it to use this feature.';
    }
  </script>
</body>
</html>
