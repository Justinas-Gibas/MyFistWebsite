# XRGallery-server

## Purpose

The `XRGallery-server` folder contains the backend code for the XR Space Platform. It is responsible for handling API requests, managing the database, and providing real-time communication services. The server is built using Node.js and other modern web technologies.

## Current Features and Modules

### API Services

- **User Authentication**: Secures the user interaction.
- **Data Fetching**: Uses REST and GraphQL APIs for optimized data handling.
- **Rate Limiting**: Protects the backend from overuse.

### Database (Supabase)

- **Real-time Synchronization**: Keeps track of changes and allows for audits.
- **Conflict Resolution**: Ensures consistency during concurrent interactions.

### Real-Time Communication

- **Live Presence**: Displays who is online.
- **Message Broadcasting**: For live events and collaboration.

### Logging and Monitoring

- **Winston**: For logging server activities and errors.
- **Sentry**: For error tracking and monitoring.

## Server Setup and Configuration

### Prerequisites

1. **Node.js and npm**: Ensure you have Node.js and npm installed on your machine. You can download and install them from [Node.js official website](https://nodejs.org/).

2. **Docker**: Ensure you have Docker installed on your machine. You can download and install it from [Docker official website](https://www.docker.com/).

### Environment Variables

Create a `.env` file in the `XRGallery-server` folder and add the following environment variables:

```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SENTRY_DSN=your_sentry_dsn
```

Replace `your_supabase_url`, `your_supabase_key`, and `your_sentry_dsn` with your actual Supabase URL, key, and Sentry DSN.

### Running the Server

1. **Clone the Repository**: Clone the repository to your local machine using the following command:
   ```bash
   git clone https://github.com/JustGibas/XRGallery.git
   ```

2. **Navigate to the Server Folder**: Change your working directory to the `XRGallery-server` folder:
   ```bash
   cd XRGallery/XRGallery-server
   ```

3. **Install Dependencies**: Install the required dependencies using npm:
   ```bash
   npm install
   ```

4. **Start the Server**: Start the server using the following command:
   ```bash
   npm start
   ```

### Running the Server with Docker

1. **Build the Docker Image**: Build the Docker image using the following command:
   ```bash
   docker-compose build
   ```

2. **Start the Docker Container**: Start the Docker container using the following command:
   ```bash
   docker-compose up
   ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## Contact

For any questions or support, please contact the maintainers through the project's GitHub repository or community channels.
