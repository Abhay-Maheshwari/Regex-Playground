# Regex Playground 🚀

A premium, cross-platform desktop Regular Expression IDE built with **Tauri**, **Svelte**, and **Rust**. Designed for speed, precision, and a high-fidelity user experience.

![App Icon](src-tauri/icons/128x128.png)

## ✨ Features

- **Real-time Match Highlighting:** Advanced dual-layer text area with pixel-perfect match overlays.
- **Pastel Color Cycling:** Consecutive matches are highlighted in distinct, accessible pastel colors for easy visualization.
- **Groups Explorer:** Structured table view for all capture groups (numbered and named) with detailed index positioning.
- **Persistent Library:** Built-in sidebar to save and manage your custom regex patterns, powered by Tauri's local file system.
- **Replace Mode:** Live preview of string replacements using standard regex replacement syntax.
- **Flag Toggles:** Interactive pill buttons for all common regex flags (`g`, `i`, `m`, `s`, `u`, `d`).
- **Cheat Sheet:** Integrated quick-reference for regex tokens and syntax.
- **Dark/Light Mode:** Full theming support with a clean, modern aesthetic.
- **Power-User Shortcuts:** 
  - `Ctrl + Enter`: Run Regex
  - `Ctrl + S`: Save to Library
  - `Esc`: Clear Playground

## 🛠️ Tech Stack

- **Frontend:** [Svelte 5](https://svelte.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Desktop Core:** [Tauri v2](https://tauri.app/)
- **Backend Logic:** Rust
- **Styling:** Vanilla CSS with custom properties (CSS Variables)
- **Icons:** Custom generated glassmorphism assets

## 🚀 Getting Started

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Abhay-Maheshwari/Regex-Playground.git
   cd Regex-Playground
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

### Building for Production (Windows)

To generate a standalone `.msi` or `.exe` installer:
```bash
npm run tauri build
```
The artifacts will be available in `src-tauri/target/release/bundle/`.

## 📄 License
MIT

---
Built with ❤️ by Antigravity
