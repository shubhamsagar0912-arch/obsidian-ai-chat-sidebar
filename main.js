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
  }
};
var AIChatView = class extends import_obsidian.ItemView {
  constructor(leaf) {
    super(leaf);
    this.currentProvider = "gemini";
    this.providerButtons = /* @__PURE__ */ new Map();
  }
  getViewType() {
    return VIEW_TYPE_AI_CHAT;
  }
  getDisplayText() {
    return "AI Chat";
  }
  getIcon() {
    return "message-circle";
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("ai-chat-sidebar-container");
    const header = container.createEl("div", { cls: "ai-chat-header" });
    const switcher = header.createEl("div", { cls: "ai-chat-switcher" });
    for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
      const btn = switcher.createEl("button", {
        cls: `ai-chat-provider-btn ${key === this.currentProvider ? "active" : ""}`,
        attr: { "aria-label": provider.name }
      });
      btn.innerHTML = `${provider.icon} ${provider.name}`;
      btn.addEventListener("click", () => this.switchProvider(key));
      this.providerButtons.set(key, btn);
    }
    const controls = header.createEl("div", { cls: "ai-chat-controls" });
    const refreshBtn = controls.createEl("button", {
      cls: "ai-chat-btn",
      attr: { "aria-label": "Refresh" }
    });
    refreshBtn.innerHTML = "\u{1F504}";
    refreshBtn.addEventListener("click", () => this.refreshWebview());
    const externalBtn = controls.createEl("button", {
      cls: "ai-chat-btn",
      attr: { "aria-label": "Open in browser" }
    });
    externalBtn.innerHTML = "\u{1F517}";
    externalBtn.addEventListener("click", () => {
      window.open(AI_PROVIDERS[this.currentProvider].url, "_blank");
    });
    this.webviewContainer = container.createEl("div", { cls: "ai-chat-webview-container" });
    this.createWebview();
  }
  switchProvider(provider) {
    if (provider === this.currentProvider)
      return;
    this.providerButtons.forEach((btn, key) => {
      if (key === provider) {
        btn.addClass("active");
      } else {
        btn.removeClass("active");
      }
    });
    this.currentProvider = provider;
    this.createWebview();
  }
  createWebview() {
    const provider = AI_PROVIDERS[this.currentProvider];
    const webview = document.createElement("webview");
    webview.setAttribute("src", provider.url);
    webview.setAttribute("class", "ai-chat-webview");
    webview.setAttribute("allowpopups", "");
    webview.setAttribute("partition", `persist:${this.currentProvider}`);
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
    this.webviewContainer.empty();
    this.webviewContainer.appendChild(webview);
  }
  refreshWebview() {
    const webview = this.webviewContainer.querySelector("webview");
    if (webview) {
      webview.reload();
    }
  }
  showError(message) {
    this.webviewContainer.empty();
    const errorDiv = this.webviewContainer.createEl("div", { cls: "ai-chat-error" });
    errorDiv.createEl("p", { text: message });
    const retryBtn = errorDiv.createEl("button", {
      text: "Retry",
      cls: "ai-chat-btn ai-chat-retry-btn"
    });
    retryBtn.addEventListener("click", () => this.createWebview());
  }
  async onClose() {
    var _a;
    (_a = this.webviewContainer) == null ? void 0 : _a.empty();
  }
};
var AIChatSidebarPlugin = class extends import_obsidian.Plugin {
  async onload() {
    this.registerView(VIEW_TYPE_AI_CHAT, (leaf) => new AIChatView(leaf));
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
