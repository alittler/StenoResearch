# Steno Ledger - App Functionality

## Overview
A digital steno-style notepad designed for high-density information management, research, and technical ledger keeping. The app features a physical "notepad" aesthetic with stacked torn paper stubs and a black book binder.

## Core Features

### 1. Notebook Management (Shelf)
- **Notebook Shelf**: The entry point of the app where users can view all their notebooks.
- **Creation**: Add new notebooks with custom titles and colors.
- **Deletion**: Remove notebooks and all associated notes.
- **Persistence**: All data is saved to `localStorage` with SHA-256 state tracking.

### 2. StenoPad (The Ledger)
- **High-Density Entry**: A streamlined interface for quick note-taking.
- **Note Types**: Supports multiple note categories:
    - `ledger` (Red)
    - `research` (Blue)
    - `outline` (Green)
    - `raw` (Purple)
- **Inline Editing**: Click any note to edit its content directly. Saves on blur or Enter.
- **Search**: Global search bar in the binder header to filter notes by content or type.
- **Autocomplete**: Type `#` in the entry field to trigger a notebook linking dropdown. Navigate with arrow keys and select with Enter/Tab.

### 3. Research Hub (Intel)
- **AI-Powered Research**: Integration with Gemini API to answer questions based on the current notebook's context.
- **Source Tracking**: Automatically captures and displays URLs from research grounding.
- **Pinning**: "Pin" research answers directly into the main ledger.

### 4. Knowledge Architect (Build)
- **Staging Area**: A space to draft complex notes or "shred" existing ones into new ledger entries.
- **Raw Input**: Quick capture for unformatted text.

### 5. Raw Text Editor (Export)
- **Full-Screen View**: A distraction-free environment for viewing and exporting the entire notebook's content in plain text.

## UI/UX Design
- **Physical Aesthetic**: 
    - Black book binder header with spine ribbing.
    - Stacked torn paper stubs at the top of the page.
    - Steno-style vertical margin line.
    - Paper texture and subtle ruling lines.
- **Responsive Layout**:
    - **Desktop**: Navigation tabs are positioned as physical dividers on the right side of the notebook.
    - **Mobile**: Navigation tabs are at the bottom for accessibility.
- **Deep Linking**: Full routing support (`react-router-dom`) with unique URLs for every notebook and tab.
- **Automatic Scrolling**: Page resets to the top on every view change.

## Technical Stack
- **Frontend**: React 19, TypeScript, Vite.
- **Styling**: Tailwind CSS.
- **Routing**: React Router 7.
- **AI**: Google Gemini API (@google/genai).
- **State Management**: React Hooks (useState, useMemo, useEffect) with LocalStorage persistence.
