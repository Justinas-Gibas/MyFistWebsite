# XR Space Platform Architecture

## Objective

Develop a modular, scalable XR platform that redefines digital experiences by integrating communication, creation, live events, and even real-world robot control within an immersive virtual world. This repository provides a roadmap for setting up the platform, along with detailed explanations of each component and solutions to architectural challenges.

## Table of Contents

- [Introduction](#introduction)
- [Frontend Components](#frontend-components)
  - [HTML Shell](#html-shell)
  - [Bootstrap JS (Main.js)](#bootstrap-js-mainjs)
  - [State Store](#state-store)
  - [Event Bus](#event-bus)
  - [Environment Manager](#environment-manager)
  - [Three.js Module](#threejs-module)
  - [Module Manager](#module-manager)
- [Backend Services](#backend-services)
  - [API Services](#api-services)
  - [Database (SpaceTimeDB)](#database-spacetimedb)
  - [AI Integration](#ai-integration)
  - [Real-Time Communication](#real-time-communication)
- [Edge Services](#edge-services)
  - [Hosting and Deployment](#hosting-and-deployment)
  - [WebAssembly (WASM) Modules](#webassembly-wasm-modules)
- [Tech Stack Details](#tech-stack-details)
- [Feature Modules](#feature-modules)
  - [VR Modules](#vr-modules)
  - [AI Interaction Module](#ai-interaction-module)
  - [Procedural Content Module](#procedural-content-module)
  - [Social Interaction Module](#social-interaction-module)
  - [Accessibility Module](#accessibility-module)
  - [Analytics Module](#analytics-module)
- [Development Environment Setup](#development-environment-setup)
  - [Prepare Development Environment](#prepare-development-environment)
  - [NPM Configuration](#npm-configuration)
  - [GitHub Configuration](#github-configuration)
  - [Vite Configuration](#vite-configuration)
  - [TypeScript Configuration](#typescript-configuration)
  - [Module CSS Architecture](#module-css-architecture)
- [Microfrontend Architecture](#microfrontend-architecture)
  - [Dynamic Remote Module Loading](#dynamic-remote-module-loading)
- [Future Roadmap](#future-roadmap)
  - [UI/UX Enhancements](#uiux-enhancements)
  - [Performance Optimization](#performance-optimization)
  - [Device Compatibility](#device-compatibility)
  - [User Experience Improvements](#user-experience-improvements)
  - [Community and Collaboration Features](#community-and-collaboration-features)
  - [Scalability Enhancements](#scalability-enhancements)
  - [Security Enhancements](#security-enhancements)
  - [Asset Management](#asset-management)
  - [Compliance and Legal](#compliance-and-legal)
  - [Monitoring and Analytics](#monitoring-and-analytics)
  - [Debugging and Error Handling](#debugging-and-error-handling)
- [Notes](#notes)
  - [Encryption and Security](#encryption-and-security)
  - [Transaction Processing](#transaction-processing)
  - [Asset Formats](#asset-formats)
  - [Voxel System Overview](#voxel-system-overview)
  - [Voxel Communication](#voxel-communication)
  - [Voxel Data Flow and Scalability](#voxel-data-flow-and-scalability)
  - [Error Handling](#error-handling)
- [License](#license)
- [Contributing](#contributing)
- [Contact](#contact)

## Introduction

This project aims to create a modular, scalable XR platform using modern web technologies. By focusing on modularity, event-driven architecture, and device compatibility, the platform allows users to communicate, create, experience live events, and even control real-world robots from an immersive virtual world. The initial focus use case is an interactive and immersive art gallery that showcases the potential of XR environments.

## Frontend Components

### HTML Shell

The HTML Shell acts as the minimal entry point for the application, providing:

- **Loading Screens**: Manage user perception of load times.
- **Module Hooks**: Dynamically inject components based on user actions or environment.
- **Responsive Layouts**: Ensure compatibility across various screen sizes and devices.

### Bootstrap JS (Main.js)

Initializes essential libraries and handles:

- **Library Loading**: For React.js, Three.js, and other core technologies.
- **Environment Checks**: Determines XR support and initializes relevant APIs.
- **Error Handling**: Catches critical errors during initialization.

### State Store

Uses Zustand for simple state management with React hooks, replacing Redux due to its simplicity, performance, and modularity. Benefits include:

- **Scalability**: As the application grows, Zustand can manage individual module states.
- **Performance**: Lightweight with less boilerplate compared to Redux.
- **Selectors and Actions**: Uses hooks for more flexible state management.

### Event Bus

Built with a Rust library such as **Tokio** or **Crossbeam** to handle module communication efficiently, offering:

- **Event Emission**: Triggered by user interactions or module state changes.
- **Message Passing**: Modules communicate through lightweight, asynchronous message channels.
- **Concurrency Management**: Ensures smooth handling of multiple events simultaneously, leveraging Rust’s concurrency model for performance.
- **Loose Coupling**: Modules can subscribe and react to events without being tightly coupled, enabling flexible and scalable communication.
- **Performance Optimization**: Through efficient memory management and low-level control, ensuring minimal overhead and high throughput.

### Environment Manager

Detects device capabilities and adjusts module loading:

- **Appropriate Module Loading**: Detects whether XR is supported and loads relevant modules.
- **Feature Detection**: Provides feedback if capabilities are lacking (e.g., no WebXR support).
- **Fallback Plans**: Offers simpler 3D views or 2D representations for devices that cannot run XR experiences. 
- **UI for Non-XR Users**: Provides an alternate interface for non-XR users, acting as a traditional web-based menu. This can also transition into the 3D space, where it serves as a HUD (Heads-Up Display) or floating plane, allowing users to navigate and interact with the XR content seamlessly. ises react three fiber html 

### Three.js Module

Handles rendering of 3D content in the XR environment:

- **Scene Management**: Manages all objects, cameras, and lights in the scene.
- **Camera and Lighting**: Pre-configured for XR and VR.
- **Dynamic Asset Loading**: Optimized for performance by lazy-loading assets.
- **Physics Simulation**: Integrated `@react-three/cannon` for smooth physics.

### Module Manager

Formerly known as Module Loader. Handles dynamic module loading with ES Modules:

- **Dynamic Loading**: Loads modules as needed to save bandwidth and improve performance.
- **Lazy Loading**: Only loads resources when necessary.
- **Dependency Injection**: Keeps modules decoupled.
- **Dynamic UI Injection**: Modules like `ui-module` and `core-testing` are implemented with dynamic loading/unloading, allowing content to be reliably injected into the website and 3D space as users move through different areas. This ensures that the user experience remains smooth and modular.

## Backend Services

### API Services

Utilizes Node.js for backend logic and API endpoints, including:

- **User Authentication**: Secures the user interaction.
- **Data Fetching**: Uses REST and GraphQL APIs for optimized data handling.
- **Rate Limiting**: Protects the backend from overuse.

### Database (SpaceTimeDB)

For real-time synchronization and history management:

- **Time-Travel Capabilities**: Keeps track of changes and allows for audits.
- **Conflict Resolution**: Ensures consistency during concurrent interactions.

### AI Integration

Integrates OpenAI GPT-4 for interactive and creative AI:

- **Conversational AI**: Provides immersive NPC and real-time assistance.
- **Creative AI**: Assists users in creating unique content.

### Real-Time Communication

Uses Socket.io for bi-directional real-time communication:

- **Live Presence**: Displays who is online.
- **Message Broadcasting**: For live events and collaboration.

## Edge Services

### Hosting and Deployment

Currently hosted on Vercel:

- **Auto Deployments**: From Git pushes.
- **CDN Integration**: Ensures fast load times.

### WebAssembly (WASM) Modules

Used for CPU-intensive tasks:

- **Physics Engine**: Offloads physics computations.
- **Rendering Optimization**: Enhances performance during XR sessions.

## Tech Stack Details

- **Frontend Framework**: React.js
- **3D Rendering**: Three.js and React-Three-Fiber
- **Physics Simulation**: `@react-three/cannon`
- **3D Helpers**: `@react-three/drei`
- **State Management**: Zustand
- **Event Handling**: RxJS
- **AI Integration**: OpenAI GPT-4 API
- **Real-Time Communication**: Socket.io
- **Database**: SpaceTimeDB
- **Hosting**: Vercel

## Feature Modules

### VR Modules

#### Initial Scene

Provides initial environment setup:

- **Voxel Environment Configuration**
- **Avatar Setup**
- **UI Elements and Environment Settings**

#### VR Art Gallery

Allows users to:

- **Explore and Experience Artwork**
- **Purchase and Contact Authors**
- **Import Art**: With watermarking and conditional loading.
- **Import 3D Scans or Videos**: Create 3D scans and deploy them as a service for income generation.

#### Dynamic XR Environment

Offers personalized experiences through:

- **User Interests**: Tailored content.
- **AI-Driven Content Generation**: Unique every time.

#### Voxel Module

Defines voxel-based interactions:

- **Segmenting Virtual Space**: Into grid units.
- **Facilitating Scalability**: Localized interactions.
- **Information Propagation**: Through neighboring voxels.
- **Voxel Coordinates**: Calculated from the origin (0,0,0).
- **Voxel Definition**: The voxel at (0,0,0) is the center, extending 5 meters in all directions for a 10-meter size if voxel size is set to 10.
- **Coordinate System**: Ensures consistent positioning within VR space.
- **Real-World Translation**: Find methods to translate real-world coordinates into XR space; may involve a separate module within the XR gallery.

### AI Interaction Module

#### NPC Movement and Guidance

Enables non-player characters to:

- **Navigate the Environment**
- **Guide Users and Tell Stories**
- **Answer Questions**: Using natural language processing

#### Conversational AI

Utilizes GPT-4 for:

- **Rich, Interactive Dialogue Experiences**

#### Creative AI Tools

Offers user-generated content creation:

- **AI-Driven Paintings**
- **Music Experiences**

#### Speech-to-Text

Implements **OpenAI's Whisper** for:

- **Accurate Speech Recognition**

### Procedural Content Module

Generates dynamic environments:

- **On-The-Fly Content Generation**
- **Procedural Techniques**: For unique experiences

### Social Interaction Module

Features include:

- **Real-Time Chat and Voice Communication**
- **User Avatars**
- **Private Rooms**: For group conversations
- **Emoji and Gesture Support**

### Accessibility Module

Ensures inclusivity through:

- **Text-to-Speech Functionality**
- **Adjustable Font Sizes**
- **Gesture Controls**
- **Simplified Navigation**
- **Voice Commands**
- **High-Contrast Modes**

### Analytics Module

Tracks user behavior:

- **Heatmaps**: Visualizing popular areas
- **Engagement Metrics**: For features and art pieces
- **Insights for Optimization**: Informs future development

### Module CSS Architecture

Continue enhancing module isolation by dynamically loading CSS per feature to improve maintainability and reduce style conflicts.

## Microfrontend Architecture

The XR Space Platform supports a microfrontend architecture, allowing for better modularity and scalability. This section provides details on the microfrontend architecture and how to dynamically load remote modules.

### Dynamic Remote Module Loading

The platform supports dynamic remote module loading, enabling modules to be loaded from remote URLs. This allows for better modularity and scalability, as modules can be developed and deployed independently.

To dynamically load a remote module, follow these steps:

1. **Define the Remote Module**: Ensure that the remote module is defined and accessible via a URL. The module should export the necessary components or functions.

2. **Update the Module Manager**: Use the `loadRemoteModule` function in the `module-loader.js` file to load the remote module. The function takes the URL and module name as parameters.

3. **Handle Module Loading in the Component**: Update the component to handle dynamic remote module loading using the `useEffect` hook. Use the `loadRemoteModule` function to load the module and set the state accordingly.

Example:

```javascript
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { loadRemoteModule } from '../../utils/module-loader';

const ModuleContainer = () => {
  const loadedModules = useSelector((state) => state.app.loadedModules);
  const [CurrentModule, setCurrentModule] = useState(null);

  useEffect(() => {
    if (!loadedModules) {
      const errorMessage = 'Error: loadedModules is undefined';
      console.error(new Error(errorMessage));
      return;
    }

    const moduleName = Object.keys(loadedModules).find((key) => loadedModules[key]);

    if (moduleName) {
      const isRemoteModule = loadedModules[moduleName].isRemote;
      const moduleUrl = loadedModules[moduleName].url;

      const loadModuleFunction = isRemoteModule ? loadRemoteModule : loadModule;

      loadModuleFunction(moduleUrl, moduleName)
        .then((module) => {
          setCurrentModule(() => module.default);
        })
        .catch((error) => {
          const errorMessage = `Error loading module ${moduleName}: ${error.message}`;
          console.error(error);
          setCurrentModule(null);
        });
    } else {
      setCurrentModule(null);
    }
  }, [loadedModules]);

  return (
    <div id="module-root" style={{ width: '100%', height: '100%' }}>
      <Suspense fallback={<div>Loading...</div>}>
        {CurrentModule ? <CurrentModule /> : <p>No module loaded.</p>}
      </Suspense>
    </div>
  );
};

export default ModuleContainer;
```

## Custom Hooks

### useSidebarLogic

The `useSidebarLogic` custom hook is used to manage the state of the sidebar. It provides the `isSidebarOpen` state and the `handleToggle` function to toggle the sidebar's visibility.

```javascript
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../state/store';

const useSidebarLogic = () => {
  const dispatch = useDispatch();
  const isSidebarOpen = useSelector((state) => state.sidebar);

  const handleToggle = () => {
    dispatch(toggleSidebar());
  };

  return { isSidebarOpen, handleToggle };
};

export default useSidebarLogic;
```

## Component Structure

### UI Folder

All UI-related components are organized into the `components/UI` folder. This includes components like `Button`, `SidebarUI`, and `Modal`.

### Index.js for Exports

An `index.js` file within the `UI` folder re-exports all components, allowing simplified imports.

Example:

```javascript
// components/UI/index.js
export { default as Button } from './Button';
export { default as SidebarUI } from './SidebarUI';
export { default as Modal } from './Modal';
```

## New Configuration Paths

### Path Aliases in tsconfig.json

Additional path aliases have been added to the `tsconfig.json` file for commonly used folders.

Example:

```json
{
  "compilerOptions": {
    "paths": {
      "@store/*": ["src/store/*"],
      "@hooks/*": ["src/hooks/*"],
      "@config/*": ["src/config/*"]
    }
  }
}
```

## Future Roadmap

### UI/UX Enhancements

Chakra UI, React Three Fiber + HTML

- **Cookies Policy**: Implement consent dialog.
- **2D UI Options**:

  - **Alternative Interface**: For easier navigation.
  - **Art Import and Settings Management**.
  - **2D Slideshow Viewing**.
  - **Consistent UI**: Render the same UI as the website within the XR space as a floating plane. Ensure compatibility with devices like Apple Vision OS.

- **Settings Interface**: User preferences and configurations.

### Performance Optimization

- **Scalability**: Improve with Three.js LOD (Level of Detail), lazy-loading assets, and optimizing dynamic module imports.
- **Geometry Optimization**: Explore `three-mesh-bvh` for optimizing 3D geometry intersections and raycasting.

### Device Compatibility

- **Mobile Support**: Enhance functionality on mobile devices.
- **Responsive Design**: Adapt to various screen sizes.

### User Experience Improvements

- **User Testing**: Gather feedback.
- **Personalization**: Based on user behavior.

### Community and Collaboration Features

- **User-Generated Content**: Create and share environments (e.g., 3D scans) or art.
- **Social Features**: Friend lists, messaging, collaborative spaces.

### Scalability Enhancements

- **Automated Scaling**: Policies using Kubernetes.
- **Global Distribution**: Utilize CDNs.

### Security Enhancements

- **Encryption**: TLS and data hashing.
- **Payment Integration**: With [Stripe](https://stripe.com/) or [PayPal](https://www.paypal.com/).
- **Robot Control Security**: Authentication and authorization layers.

### Asset Management

- **Image Import Function**: Watermarking and format conversion.
- **3D Asset Formats**: Use [USD](https://graphics.pixar.com/usd/), [USDZ](https://developer.apple.com/augmented-reality/quick-look/), or [GLTF](https://www.khronos.org/gltf/). Consider modern image formats like WebP or JPEG 2000 for textures.
- **LOD Implementation**: Levels of Detail for performance.

### Compliance and Legal

- **Data Protection**: Compliance with GDPR, CCPA.
- **Accessibility Standards**: Adhere to [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/).
- **Policies**: Clear terms of service and privacy policies.

### Monitoring and Analytics

- **Backend Monitoring**: Integrate [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/).
- **Logging and Alerting**: Proactive issue resolution.

### Debugging and Error Handling

- **Error-Catching Libraries**: Manage issues effectively.
- **Testing**: Unit and integration tests for stability.

### Additional Development Ideas

- **Cross-Platform Integration**: Ensure compatibility with emerging XR platforms like Apple Vision OS and Meta Quest.
- **Blockchain Integration**: Explore the use of blockchain for asset ownership and transactions.
- **Microservices Architecture**: Further modularize backend services for scalability.
- **AI-Powered Moderation**: Implement AI tools for content moderation and community guidelines enforcement.
- **Energy Optimization**: Optimize code and assets for lower energy consumption on mobile and wearable devices.
- **Environmental Mapping**: Incorporate real-world environmental data into the XR space for enhanced realism.
- **Educational Modules**: Develop modules for educational purposes, such as virtual classrooms or training simulations.
- **API for Developers**: Provide an API or SDK for third-party developers to create plugins or extensions.

---

## Notes

React Testing Library, Jest, and React Router.

### Encryption and Security

- **Data Encryption**: Strong encryption mechanisms such as TLS are required to secure data transfers.
- **Data Hashing**: For sensitive information to improve security.

### Transaction Processing

Plan and integrate secure transaction systems, like Stripe or PayPal, for purchasing digital assets.

### Asset Formats

Use formats like USD, USDZ, or GLTF to ensure compatibility and optimal performance.

### Voxel System Overview

- **Voxel Structure**: The platform's world is divided into voxels, each representing a cubic segment of space, with a size of 10x10 meters. These voxels are the fundamental units of interaction, allowing for localized data management and user experiences.
- **Stable vs Dynamic Areas**: Central areas of the virtual environment are stable and change infrequently, often used for persistent exhibits, while outer areas are dynamically generated corridors influenced by user interactions and interests. This structure allows for seamless exploration while keeping critical areas consistent.
- **Voxel Extensions**: Corridors extend from the stable areas into procedurally generated spaces. When multiple users enter the same corridor, the AI tailors content to match their shared interests, fostering unique, collaborative experiences.

### Voxel Communication

- **Neighbor-to-Neighbor Communication**: Voxels communicate with adjacent voxels to propagate state changes and synchronize the environment dynamically. This communication minimizes state update signals and ensures smooth transitions between segments.
- **Direct State Sharing**: Neighboring voxels establish direct state-sharing channels, optimizing asset loading and maintaining continuity of user interactions as they move between areas.

### Voxel Data Flow and Scalability

- **Client-Side Position Tracking**: User positions are calculated from a central coordinate, with voxels managing state based on relative positioning. Users remain within a voxel until they move beyond a specified boundary (e.g., 5 meters), triggering state updates and transitioning to a new voxel.
- **Scalability through Decentralization**: Voxels are designed to function as micro-frontends, deployed across Kubernetes-managed servers to ensure scalability. Each voxel only communicates with its neighbors, and significant processing happens on the client side to minimize server load and latency.
- **Procedural Adaptability**: Voxel environments adapt based on user inputs, dynamically generating new spaces or content as needed. This ensures that the world can grow organically, accommodating more users and interactions without overwhelming system resources.

### Error Handling

Implement a robust error-handling system to manage runtime issues effectively.

- **Voxel Error Isolation**: Errors occurring in one voxel should be contained and managed locally to prevent them from affecting the entire system. This isolation approach ensures that user experiences in unaffected areas remain seamless.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## Contact

For any questions or support, please contact the maintainers through the project's GitHub repository or community channels.

## Folder-specific README files

- [XRGallery-client](XRGallery-client/README.md)
- [XRGallery-server](XRGallery-server/README.md)
- [XRGallery-files](XRGallery-files/README.md)
- [XRGallery-client/src/wasm](XRGallery-client/src/wasm/README.md)
