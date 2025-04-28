# AI CONFIGURATION & COLLABORATION SYSTEM
=========================================================================

**PRIMARY CONTROL INTERFACE FOR AI COLLABORATION**

## Overview
This document serves as the primary guidance system for AI assistants working on the Portfolio Engine project. It defines permissions, current tasks, and project structure to ensure consistent collaboration.

=========================================================================
## Current Session
=========================================================================
📌 ACTIVE: Update, create documentation standards
  ├── STATUS: In Progress
  ├── PRIORITY: High
  ├── CYCLE: ID 1.0.1
  └── CURRENT FOCUS: Creating consistent documentation

=========================================================================
## 📂 File Permission System
=========================================================================
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
1. Only modify files following the permission system below
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

### Permission Levels
| Symbol | Level | Meaning |
|--------|-------|---------|
| [x] | Full Access | Free to modify and improve |
| [o] | Restricted Access | Edit only from approved proposals.md |
| [~] | Suggest Only | Create suggestions in ai-user-workspace |
| [_] | Reference | Use as example of what we want |
| [ ] | Read Only | Reference for understanding only |

=========================================================================
## 📁 Project File Structure 

### AI Workspace Files
- [~] ai-user-workspace/*.md (Config, README, guides)
- [x] ai-user-workspace/dev-proposals/**/*.md
- [x] ai-user-workspace/dev-tasks/**/*.md
- [x] ai-user-workspace/ai-tasks/**/*.md
- [x] ai-user-workspace/user-tasks/**/*.md

### Core Project Files
- [~] README.md, app.js, config.js
- [ ] index.html

### Engine Directory
- [~] engine/start.js
- [ ] engine/loop.js, engine/fallbacks.js
- [~] engine/core/*.js (ecs, system, scheduler, SystemRegistry)
- [~] engine/systems/*.js (Event, Error, Layout, Module, etc.)
- [~] engine/utils/*.js (asset-manager, css-loader, EntityCreator)

### Modules
- [~] modules/dev-tools/*.js, *.css
- [ ] modules/header, modules/dropdown, modules/page

### Elements
- [~] elements/dev-tools/*.js, *.css
- [ ] elements/header, elements/dropdown, elements/page

### Pages
- [~] pages/devtools/devtools.js, pages/about/about.js
- [ ] pages/projects/**/*.js
- [ ] pages/resume/resume.js, pages/vison/vison.js

### Tests and Configuration
- [~] tests/test-config.js
- [ ] tests/register-tests.js
## 🛠️ AI Agent Configuration

### Agent Role Configuration
| Toggle | Role | Task |
|--------|-------|-------|
| [x] | Architect | System design and planning | expected to edit proposals.md
| [x] | Documentarian | Creating and updating documentation | expexted to edit js header or md files 
| [ ] | Refactorer | Code analysis and improvement | expexted to analize and edit proposals. md file
| [ ] | Developer | Implementation of features | expected to folow ai-config.md file and next-step files
| [x] | Test writer | Quality assurance and validation | writes test expected to crete or edit filename.test.js 
| [X] | Reviewer | Code review and feedback | 
| [ ] | Optimizer | Performance enhancement |
| [ ] | Security Analyst | Vulnerability assessment |
| [ ] | UX Consultant | User experience recommendations |
| [ ] | Accessibility Expert | Ensuring inclusive design |

=========================================================================
## 🎯 AI Action Permissions

### Permitted Actions
- [x] Modify ai-user-workspace files
- [ ] Simplify
- [x] Rewrite
- [x] Propose edit

### Restricted Actionscode review
- [ ] Create new files
- [X] Edit code

=========================================================================
**This file is maintained collaboratively by JG and AI assistants.**  
Last updated: Cycle ID 1.0.1

