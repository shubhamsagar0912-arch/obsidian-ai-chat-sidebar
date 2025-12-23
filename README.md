# AI Chat Sidebar for Obsidian

Embed **Gemini** and **ChatGPT** directly in your Obsidian sidebar! Switch between AI providers with one click. No API keys required - just sign in with your accounts.

![Plugin Preview](https://img.shields.io/badge/Obsidian-Plugin-purple)

## Features

- 🎯 **Multiple AI Providers**: Switch between Gemini and ChatGPT instantly
- 🔐 **Direct Sign-In**: Use your Google/OpenAI account - no API keys needed
- 📌 **Right Sidebar**: Opens conveniently in the right sidebar
- 🔄 **Quick Controls**: Refresh and open in browser buttons
- 💾 **Persistent Sessions**: Stay signed in across Obsidian restarts
- 🌙 **Theme Aware**: Adapts to your Obsidian theme

## Installation

### Manual Installation

1. Download the latest release
2. Extract to your vault's plugins folder: `<vault>/.obsidian/plugins/ai-chat-sidebar/`
3. Enable the plugin in Obsidian Settings → Community Plugins

### Building from Source

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/obsidian-ai-chat-sidebar.git
cd obsidian-ai-chat-sidebar

# Install dependencies
npm install

# Build the plugin
npm run build
```

## Usage

1. Click the 💬 chat icon in the left ribbon
2. Or use Command Palette (Cmd/Ctrl + P) → "Open AI Chat"
3. Click **✨ Gemini** or **🤖 ChatGPT** to switch providers
4. Sign in with your account when prompted
5. Start chatting!

## Commands

| Command | Description |
|---------|-------------|
| Open AI Chat | Opens the AI chat sidebar |
| Toggle AI Chat | Opens or closes the sidebar |

## Supported AI Providers

| Provider | URL | Session |
|----------|-----|---------|
| ✨ Gemini | gemini.google.com | Persistent |
| 🤖 ChatGPT | chat.openai.com | Persistent |

## Requirements

- Obsidian v1.0.0 or higher (Desktop only)
- Internet connection
- Google account (for Gemini) / OpenAI account (for ChatGPT)

## Troubleshooting

### Can't sign in?
- Try the "Open in browser" button (🔗) to sign in via your default browser first
- Make sure third-party cookies aren't blocked

### Chat not loading?
- Check your internet connection
- Click the refresh button (🔄)
- Restart Obsidian

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
