# CSStiller - AI Website Restyler 🎨

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)

**CSStiller** is a powerful frontend development tool that uses Artificial Intelligence to instantly modernize and restyle legacy HTML websites. Simply upload your HTML files, describe your desired look (e.g., "Cyberpunk Neon", "Corporate Minimal"), and let the AI generate a global CSS theme and rewrite your HTML structure to match.

## ✨ Features

- **AI-Powered CSS Generation**: Creates modern, responsive, and accessible CSS based on natural language prompts.
- **Intelligent HTML Rewriting**: automatically restructures your existing HTML files to utilize the new global styles and class names.
- **Dual AI Provider Support**:
  - ☁️ **Google Gemini**: Uses the latest Gemini 2.5/3.0 models for high-quality cloud generation.
  - 🏠 **Local Ollama**: Connects to your local Ollama instance to use open-source models (Llama 3, Mistral, etc.) without API costs.
- **Live Preview**: Instantly visualize changes with an integrated side-by-side code and iframe preview.
- **Project Management**:
  - 📂 **Drag & Drop Upload**: Support for multiple HTML/Text files.
  - 💾 **Save All**: Download your entire restyled project as a `.zip` archive.
  - 📜 **History**: Auto-saves your sessions so you never lose a good design.
  - ↩️ **Undo/Redo**: Full state management for your prompts and file selection.
- **Template Gallery**: Save your favorite prompts, manage custom templates, and "like" existing ones.
- **Developer Experience**:
  - Dark/Light Mode support.
  - Syntax highlighting and validation.
  - Keyboard shortcuts (`Ctrl+S` save, `Ctrl+Z` undo).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google Gemini API Key (for cloud models)
- [Ollama](https://ollama.com/) (optional, for local models)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Peter-Pix/CSStiller.git
   cd CSStiller
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   Create a `.env` file in the root directory and add your Google API key:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```
   > **Note:** The application uses `process.env.API_KEY`. Ensure your bundler or environment injects this correctly.

4. **Start the development server**
   ```bash
   npm start
   ```

## 🦙 Setting up Local AI (Ollama)

To use local models instead of Google Gemini:

1. Download and install [Ollama](https://ollama.com/).
2. Pull a model (e.g., Llama 3):
   ```bash
   ollama pull llama3
   ```
3. Start the Ollama server. Ensure it is allowing cross-origin requests if necessary, though the app connects to `http://127.0.0.1:11434` by default.
4. Open CSStiller, click the model dropdown in the header, and your local models will appear under the **"Local (Ollama)"** group.

## 🎮 Usage

1. **Upload**: Drag and drop up to 4 HTML files into the upload zone.
2. **Prompt**: Type a description of the design you want (e.g., "A dark mode dashboard with card layouts and blue accents").
   - *Tip: Use the "Templates" gallery to pick a pre-made style.*
3. **Generate**: Click "Generate New Style". The AI will first generate a `style.css` and then rewrite your HTML files one by one.
4. **Preview & Edit**: Click on files in the sidebar to view code. Toggle "Preview" mode for HTML files to see the rendered result.
5. **Export**: Click "Save All (ZIP)" or press `Ctrl+S` to download your modernized website.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Download project as ZIP |
| `Ctrl + Z` | Undo last action |
| `Ctrl + Y` | Redo last action |

## 🛠️ Built With

- **Framework**: React 19
- **Styling**: Tailwind CSS
- **AI SDK**: Google GenAI SDK
- **Icons**: Lucide React
- **Utils**: JSZip (Compression)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
