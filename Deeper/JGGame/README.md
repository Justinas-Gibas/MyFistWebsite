Dark Fantasy VR RPG with Base-Building – Game Design Document (For AI Dev Agent)
1. Game Overview
Title: [Working Title] – A First-Person, Diablo-Like RPG, Tower Defense, Base Building & City Management Game
Genre: Action RPG with Tower Defense, Base Building, and City Management
Platform: Browser-based VR using Three.js/A-Frame and WebXR
Visual Style: Low-poly, dark fantasy with retro-inspired aesthetics
Core Vision:

A first-person immersive experience reminiscent of Diablo’s loot-driven combat and RPG progression, combined with strategic base defense and city management (similar to settlement systems in Fallout 4, where NPCs can be hired to improve your stronghold).
No pre-made assets will be used—instead, all assets are generated at runtime using procedural and generative AI techniques. For instance, NPCs and enemies will be represented by 2D textures mapped onto 3D planes with a “look-at” behavior (inspired by classic Doom/Diablo sprite techniques).
Generative AI will also be employed to create new enemy variations, dynamic NPC portraits, and environmental textures on the fly, ensuring a constantly evolving visual experience.
2. Core Gameplay Mechanics
2.1 Action RPG Combat (First-Person)
Combat: Fast-paced, visceral melee, ranged, and magic-based combat with VR motion controls.
Weapon Variety: Melee (swords, axes), ranged (bows, crossbows), and magic spells with intuitive VR gestures.
Enemy AI: Procedurally varied enemy behaviors that challenge the player’s skills in real time.
Physics Integration: Realistic impacts and object interactions powered by a physics engine (via aframe-physics-system).
2.2 Base Building & Tower Defense
Settlement Creation: Players build and expand a fortress/settlement from scratch, designing defenses, walls, towers, traps, and more.
Resource Management: Gather resources from the procedural world to construct, upgrade, and fortify the base.
Tower Defense: Periodic enemy waves attack the base, requiring real-time tactical decisions—similar to classic tower defense games.
City Management: As the game evolves, hire and manage NPCs to serve various roles (guards, workers, traders) to develop your city, echoing the settlement systems found in Fallout 4.
2.3 Procedural & Generative Content
Asset Generation:
Dynamic Asset Creation: No external assets will be used. Instead, all visuals are generated on the fly via procedural algorithms and generative AI.
NPCs & Enemies: Characters are rendered as 2D textures on 3D planes with “look-at” behavior, ensuring they always face the player—evoking the classic feel of Doom/Diablo sprites.
Variations: Generative AI is tasked with creating variations of enemies, NPC portraits, and even environmental textures, ensuring a unique look each playthrough.
World & Quest Generation:
Procedural World: Landscapes, dungeons, ruins, and biomes are generated algorithmically to keep exploration fresh.
Dynamic Quests & NPC Dialogue: AI-driven systems generate quests and dynamic dialogue tailored to the player’s actions and the evolving game state.
2.4 AI-Driven Narrative & NPCs
Dynamic Storytelling: NPC interactions, dialogue, and quest narratives are generated in real time via an integrated AI (using OpenAI or Mistral).
Adaptive World Events: An AI “Game Director” monitors game state to trigger events (e.g., enemy sieges, environmental changes) that balance challenge and immersion.
NPC Management: NPCs are hired, managed, and evolve based on player choices—mirroring a living city where each decision has lasting consequences.
3. Aesthetics & Visual Direction
Low-Poly, Dark Fantasy Look:
Emphasis on stylized, low-poly models and environments to maintain performance in WebXR.
The art style is minimalist yet atmospheric, using dynamic lighting, shadows, and simple textures to evoke a gothic, foreboding mood.
Runtime Asset Generation:
All assets, including 2D textures for NPCs/enemies and environmental details, are generated procedurally.
NPC Representation: Characters are rendered on 3D planes with generated 2D textures. They use a “look-at” component to always face the player, mimicking classic sprite techniques.
Variations: A generative system creates endless variations of enemies, ensuring each encounter feels fresh and unpredictable.
City & Settlement Aesthetics:
Base-building elements (walls, towers, traps) follow the same low-poly aesthetic.
Hired NPCs add life and diversity to the settlement, with their appearances and outfits generated dynamically to match the dark fantasy theme.
4. Technical & Implementation Highlights
(For the AI dev agent—focus on code generation and system integration.)

Framework & Libraries:
A-Frame 1.7.0 on top of Three.js for VR rendering.
Physics via aframe-physics-system (using Cannon.js or similar).
UI components using Shoelace 2.20.0 and immersive UI with aframe-gui.
Audio via Howler.js 2.2.3 for adaptive soundscapes.
Generative algorithms will leverage libraries like simplex-noise.js for terrain and procedural content.
Generative AI Integration:
Use OpenAI or Mistral APIs to generate dynamic NPC dialogue, quest text, and even visual variations (asset textures).
The AI agent is responsible for the coding aspects of asset generation systems, NPC behavior trees, and dynamic quest pipelines.
Asset Generation System:
Implement a system that, at runtime, creates 2D textures (via generative techniques or neural style transfer) for NPCs and maps these textures onto 3D planes.
Ensure assets are created “on the fly” without reliance on pre-made models or textures.
Networking & Future Expansion:
Core design remains single-player with potential expansion into multiplayer using networked-aframe.
All multiplayer-relevant game states (base layout, enemy waves, NPC behavior) should be designed for synchronization, but initial focus is on single-player experience.
5. Project Vision Summary
Gameplay: A first-person, immersive, dark fantasy RPG combining action combat, tower defense, base-building, and city management—where the world is as alive as the narrative, thanks to procedural and AI-driven content.
Aesthetics: Low-poly, retro-inspired visuals with all assets generated at runtime. NPCs and enemies are rendered as 2D sprites on 3D planes with a “look-at” mechanic, echoing the style of classic titles like Doom and Diablo.
Narrative: A dynamically evolving story world where quests, NPC interactions, and world events are generated by an AI, ensuring a unique experience every session.
Development Approach: Leave all dev-specific, technical integration (code-level details, system architecture) to the AI dev agent. Our focus here is on conveying the artistic vision, game mechanics, and overall feel.
