var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => AIChatSidebarPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var VIEW_TYPE_AI_CHAT = "ai-chat-sidebar-view";
var AI_PROVIDERS = {
  gemini: {
    name: "Gemini",
    url: "https://gemini.google.com/app",
    icon: "\u2728"
  },
  chatgpt: {
    name: "ChatGPT",
    url: "https://chat.openai.com",
    icon: "\u{1F916}"
  },
  claude: {
    name: "Claude",
    url: "https://claude.ai",
    icon: "\u{1F9E0}"
  },
  deepseek: {
    name: "DeepSeek",
    url: "https://chat.deepseek.com",
    icon: "\u{1F30A}"
  },
  grok: {
    name: "Grok",
    url: "https://grok.x.ai",
    icon: "\u{1F680}"
  },
  perplexity: {
    name: "Perplexity",
    url: "https://www.perplexity.ai",
    icon: "\u{1F50D}"
  },
  copilot: {
    name: "Copilot",
    url: "https://copilot.microsoft.com",
    icon: "\u{1F4A0}"
  },
  mistral: {
    name: "Mistral",
    url: "https://chat.mistral.ai",
    icon: "\u{1F300}"
  },
  poe: {
    name: "Poe",
    url: "https://poe.com",
    icon: "\u{1F4AC}"
  },
  huggingchat: {
    name: "HuggingChat",
    url: "https://huggingface.co/chat",
    icon: "\u{1F917}"
  },
  cohere: {
    name: "Cohere",
    url: "https://coral.cohere.com",
    icon: "\u{1F537}"
  },
  pi: {
    name: "Pi",
    url: "https://pi.ai",
    icon: "\u{1F967}"
  },
  phind: {
    name: "Phind",
    url: "https://www.phind.com",
    icon: "\u{1F4BB}"
  },
  you: {
    name: "You.com",
    url: "https://you.com",
    icon: "\u{1F464}"
  },
  kimi: {
    name: "Kimi",
    url: "https://kimi.moonshot.cn",
    icon: "\u{1F319}"
  }
};
var DEFAULT_SETTINGS = {
  defaultProvider: "gemini",
  toolbarProviders: ["gemini", "chatgpt", "claude"]
};
var AIChatView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.providerButtons = /* @__PURE__ */ new Map();
    this.plugin = plugin;
    this.currentProvider = plugin.settings.defaultProvider;
  }
  getViewType() {
    return VIEW_TYPE_AI_CHAT;
  }
  getDisplayText() {
    const provider = AI_PROVIDERS[this.currentProvider];
    return provider ? `${provider.icon} ${provider.name}` : "AI Chat";
  }
  getIcon() {
    return "message-circle";
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("ai-chat-sidebar-container");
    this.webviewContainer = container.createEl("div", { cls: "ai-chat-webview-container" });
    this.createWebview();
    const toolbar = container.createEl("div", { cls: "ai-chat-toolbar" });
    const switcherGroup = toolbar.createEl("div", { cls: "ai-chat-switcher-group" });
    for (const key of this.plugin.settings.toolbarProviders) {
      const provider = AI_PROVIDERS[key];
      if (!provider)
        continue;
      const btn = switcherGroup.createEl("button", {
        cls: `ai-chat-provider-btn ${key === this.currentProvider ? "active" : ""}`,
        attr: { "aria-label": provider.name, "data-provider": key }
      });
      btn.textContent = provider.name;
      btn.addEventListener("click", () => this.selectProvider(key));
      this.providerButtons.set(key, btn);
    }
    const refreshBtn = toolbar.createEl("button", {
      cls: "ai-chat-toolbar-btn ai-chat-refresh-btn",
      attr: { "aria-label": "Refresh" }
    });
    refreshBtn.innerHTML = "\u21BB";
    refreshBtn.addEventListener("click", () => this.refreshWebview());
  }
  updateProvider(provider) {
    if (provider === this.currentProvider)
      return;
    this.currentProvider = provider;
    this.updateProviderButtons();
    this.createWebview();
    this.app.workspace.requestSaveLayout();
  }
  selectProvider(provider) {
    if (provider === this.currentProvider)
      return;
    this.plugin.settings.defaultProvider = provider;
    this.plugin.saveSettings();
    this.updateProvider(provider);
  }
  updateProviderButtons() {
    this.providerButtons.forEach((btn, key) => {
      if (key === this.currentProvider) {
        btn.addClass("active");
      } else {
        btn.removeClass("active");
      }
    });
  }
  createWebview() {
    const provider = AI_PROVIDERS[this.currentProvider];
    const existingWebview = this.webviewContainer.querySelector("webview");
    if (existingWebview) {
      existingWebview.remove();
    }
    const webview = document.createElement("webview");
    webview.setAttribute("src", provider.url);
    webview.setAttribute("class", "ai-chat-webview");
    webview.setAttribute("allowpopups", "");
    webview.setAttribute("partition", "persist:ai-chat-shared");
    webview.setAttribute("webpreferences", "contextIsolation=no");
    webview.addEventListener("did-start-loading", () => {
      this.webviewContainer.addClass("loading");
    });
    webview.addEventListener("did-stop-loading", () => {
      this.webviewContainer.removeClass("loading");
    });
    webview.addEventListener("did-fail-load", (event) => {
      console.error(`${provider.name} webview failed to load:`, event);
      if (event.errorCode !== -3) {
        this.showError(`Failed to load ${provider.name}. Check your internet connection.`);
      }
    });
    webview.addEventListener("new-window", (event) => {
      const url = event.url;
      if (url.includes("accounts.google.com") || url.includes("google.com/signin") || url.includes("auth0.openai.com") || url.includes("auth.openai.com") || url.includes("login.live.com") || url.includes("appleid.apple.com")) {
        window.open(url, "_blank");
      }
    });
    const refreshBtn = this.webviewContainer.querySelector(".ai-chat-refresh-btn");
    this.webviewContainer.insertBefore(webview, refreshBtn);
  }
  refreshWebview() {
    const webview = this.webviewContainer.querySelector("webview");
    if (webview) {
      webview.reload();
    }
  }
  showError(message) {
    const existingWebview = this.webviewContainer.querySelector("webview");
    if (existingWebview) {
      existingWebview.remove();
    }
    const refreshBtn = this.webviewContainer.querySelector(".ai-chat-refresh-btn");
    const errorDiv = document.createElement("div");
    errorDiv.className = "ai-chat-error";
    errorDiv.innerHTML = `<p>${message}</p>`;
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "Retry";
    retryBtn.className = "ai-chat-btn ai-chat-retry-btn";
    retryBtn.addEventListener("click", () => {
      errorDiv.remove();
      this.createWebview();
    });
    errorDiv.appendChild(retryBtn);
    this.webviewContainer.insertBefore(errorDiv, refreshBtn);
  }
  async onClose() {
    var _a;
    (_a = this.webviewContainer) == null ? void 0 : _a.empty();
  }
};
var AIChatSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "AI Chat Sidebar Settings" });
    new import_obsidian.Setting(containerEl).setName("Default Provider").setDesc("The AI provider to load when opening the sidebar").addDropdown((dropdown) => {
      for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
        dropdown.addOption(key, `${provider.icon} ${provider.name}`);
      }
      dropdown.setValue(this.plugin.settings.defaultProvider);
      dropdown.onChange(async (value) => {
        this.plugin.settings.defaultProvider = value;
        await this.plugin.saveSettings();
        this.plugin.updateOpenViews();
      });
    });
    containerEl.createEl("h3", { text: "Toolbar Providers" });
    containerEl.createEl("p", {
      text: "Choose which 3 AI providers appear in the bottom toolbar for quick switching.",
      cls: "setting-item-description"
    });
    new import_obsidian.Setting(containerEl).setName("Toolbar Slot 1").addDropdown((dropdown) => {
      for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
        dropdown.addOption(key, `${provider.icon} ${provider.name}`);
      }
      dropdown.setValue(this.plugin.settings.toolbarProviders[0] || "gemini");
      dropdown.onChange(async (value) => {
        this.plugin.settings.toolbarProviders[0] = value;
        await this.plugin.saveSettings();
        this.plugin.refreshAllViews();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Toolbar Slot 2").addDropdown((dropdown) => {
      for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
        dropdown.addOption(key, `${provider.icon} ${provider.name}`);
      }
      dropdown.setValue(this.plugin.settings.toolbarProviders[1] || "chatgpt");
      dropdown.onChange(async (value) => {
        this.plugin.settings.toolbarProviders[1] = value;
        await this.plugin.saveSettings();
        this.plugin.refreshAllViews();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Toolbar Slot 3").addDropdown((dropdown) => {
      for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
        dropdown.addOption(key, `${provider.icon} ${provider.name}`);
      }
      dropdown.setValue(this.plugin.settings.toolbarProviders[2] || "claude");
      dropdown.onChange(async (value) => {
        this.plugin.settings.toolbarProviders[2] = value;
        await this.plugin.saveSettings();
        this.plugin.refreshAllViews();
      });
    });
  }
};
var AIChatSidebarPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_AI_CHAT, (leaf) => new AIChatView(leaf, this));
    this.addSettingTab(new AIChatSettingTab(this.app, this));
    this.addRibbonIcon("message-circle", "Open AI Chat", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-ai-chat-sidebar",
      name: "Open AI Chat",
      callback: () => {
        this.activateView();
      }
    });
    this.addCommand({
      id: "toggle-ai-chat-sidebar",
      name: "Toggle AI Chat",
      callback: () => {
        this.toggleView();
      }
    });
    console.log("AI Chat Sidebar plugin loaded");
  }
  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_AI_CHAT);
    console.log("AI Chat Sidebar plugin unloaded");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  updateOpenViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_AI_CHAT);
    leaves.forEach((leaf) => {
      const view = leaf.view;
      if (view && view.updateProvider) {
        view.updateProvider(this.settings.defaultProvider);
      }
    });
  }
  refreshAllViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_AI_CHAT);
    if (leaves.length > 0) {
      leaves.forEach((leaf) => leaf.detach());
      this.activateView();
    }
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_AI_CHAT)[0];
    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({
          type: VIEW_TYPE_AI_CHAT,
          active: true
        });
      }
    }
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
  async toggleView() {
    const { workspace } = this.app;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_AI_CHAT);
    if (leaves.length > 0) {
      leaves.forEach((leaf) => leaf.detach());
    } else {
      await this.activateView();
    }
  }
};
