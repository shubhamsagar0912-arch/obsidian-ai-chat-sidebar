import { App, ItemView, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';

const VIEW_TYPE_AI_CHAT = 'ai-chat-sidebar-view';

interface AIProvider {
    name: string;
    url: string;
    icon: string;
}

const AI_PROVIDERS: Record<string, AIProvider> = {
    gemini: {
        name: 'Gemini',
        url: 'https://gemini.google.com/app',
        icon: '✨'
    },
    chatgpt: {
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        icon: '🤖'
    },
    claude: {
        name: 'Claude',
        url: 'https://claude.ai',
        icon: '🧠'
    },
    deepseek: {
        name: 'DeepSeek',
        url: 'https://chat.deepseek.com',
        icon: '🌊'
    },
    grok: {
        name: 'Grok',
        url: 'https://grok.x.ai',
        icon: '🚀'
    },
    perplexity: {
        name: 'Perplexity',
        url: 'https://www.perplexity.ai',
        icon: '🔍'
    },
    copilot: {
        name: 'Copilot',
        url: 'https://copilot.microsoft.com',
        icon: '💠'
    },
    mistral: {
        name: 'Mistral',
        url: 'https://chat.mistral.ai',
        icon: '🌀'
    },
    poe: {
        name: 'Poe',
        url: 'https://poe.com',
        icon: '💬'
    },
    huggingchat: {
        name: 'HuggingChat',
        url: 'https://huggingface.co/chat',
        icon: '🤗'
    },
    cohere: {
        name: 'Cohere',
        url: 'https://coral.cohere.com',
        icon: '🔷'
    },
    pi: {
        name: 'Pi',
        url: 'https://pi.ai',
        icon: '🥧'
    },
    phind: {
        name: 'Phind',
        url: 'https://www.phind.com',
        icon: '💻'
    },
    you: {
        name: 'You.com',
        url: 'https://you.com',
        icon: '👤'
    },
    kimi: {
        name: 'Kimi',
        url: 'https://kimi.moonshot.cn',
        icon: '🌙'
    }
};

interface AIChatSettings {
    defaultProvider: string;
    toolbarProviders: string[];
}

const DEFAULT_SETTINGS: AIChatSettings = {
    defaultProvider: 'gemini',
    toolbarProviders: ['gemini', 'chatgpt', 'claude']
};

class AIChatView extends ItemView {
    private webviewContainer!: HTMLElement;
    private currentProvider: string;
    private plugin: AIChatSidebarPlugin;
    private providerButtons: Map<string, HTMLButtonElement> = new Map();

    constructor(leaf: WorkspaceLeaf, plugin: AIChatSidebarPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.currentProvider = plugin.settings.defaultProvider;
    }

    getViewType(): string {
        return VIEW_TYPE_AI_CHAT;
    }

    getDisplayText(): string {
        const provider = AI_PROVIDERS[this.currentProvider];
        return provider ? `${provider.icon} ${provider.name}` : 'AI Chat';
    }

    getIcon(): string {
        return 'message-circle';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('ai-chat-sidebar-container');

        // Create webview container
        this.webviewContainer = container.createEl('div', { cls: 'ai-chat-webview-container' });

        // Create the webview
        this.createWebview();

        // Create bottom toolbar stripe
        const toolbar = container.createEl('div', { cls: 'ai-chat-toolbar' });

        // Provider switcher group (left side) - only show configured toolbar providers
        const switcherGroup = toolbar.createEl('div', { cls: 'ai-chat-switcher-group' });

        for (const key of this.plugin.settings.toolbarProviders) {
            const provider = AI_PROVIDERS[key];
            if (!provider) continue;

            const btn = switcherGroup.createEl('button', {
                cls: `ai-chat-provider-btn ${key === this.currentProvider ? 'active' : ''}`,
                attr: { 'aria-label': provider.name, 'data-provider': key }
            });
            btn.textContent = provider.name;
            btn.addEventListener('click', () => this.selectProvider(key));
            this.providerButtons.set(key, btn);
        }

        // Refresh button (right side)
        const refreshBtn = toolbar.createEl('button', {
            cls: 'ai-chat-toolbar-btn ai-chat-refresh-btn',
            attr: { 'aria-label': 'Refresh' }
        });
        refreshBtn.innerHTML = '↻';
        refreshBtn.addEventListener('click', () => this.refreshWebview());
    }

    updateProvider(provider: string): void {
        if (provider === this.currentProvider) return;
        this.currentProvider = provider;
        this.updateProviderButtons();
        this.createWebview();
        // Trigger a re-render of the view header by requesting layout
        this.app.workspace.requestSaveLayout();
    }

    private selectProvider(provider: string): void {
        if (provider === this.currentProvider) return;

        // Update settings
        this.plugin.settings.defaultProvider = provider;
        this.plugin.saveSettings();
        this.updateProvider(provider);
    }

    private updateProviderButtons(): void {
        this.providerButtons.forEach((btn, key) => {
            if (key === this.currentProvider) {
                btn.addClass('active');
            } else {
                btn.removeClass('active');
            }
        });
    }

    private createWebview(): void {
        const provider = AI_PROVIDERS[this.currentProvider];

        // Clear only the webview, keep the refresh button
        const existingWebview = this.webviewContainer.querySelector('webview');
        if (existingWebview) {
            existingWebview.remove();
        }

        // Use Electron's webview tag for full browser functionality
        const webview = document.createElement('webview');
        webview.setAttribute('src', provider.url);
        webview.setAttribute('class', 'ai-chat-webview');
        webview.setAttribute('allowpopups', '');
        // Use shared partition so Google auth persists across all providers
        webview.setAttribute('partition', 'persist:ai-chat-shared');

        // Enable features needed for sign-in
        webview.setAttribute('webpreferences', 'contextIsolation=no');

        // Handle loading events
        webview.addEventListener('did-start-loading', () => {
            this.webviewContainer.addClass('loading');
        });

        webview.addEventListener('did-stop-loading', () => {
            this.webviewContainer.removeClass('loading');
        });

        webview.addEventListener('did-fail-load', (event: any) => {
            console.error(`${provider.name} webview failed to load:`, event);
            if (event.errorCode !== -3) { // Ignore aborted loads
                this.showError(`Failed to load ${provider.name}. Check your internet connection.`);
            }
        });

        // Handle new window requests (for auth popups)
        webview.addEventListener('new-window', (event: any) => {
            const url = event.url;
            // Allow auth popups for Google and OpenAI
            if (url.includes('accounts.google.com') ||
                url.includes('google.com/signin') ||
                url.includes('auth0.openai.com') ||
                url.includes('auth.openai.com') ||
                url.includes('login.live.com') ||
                url.includes('appleid.apple.com')) {
                window.open(url, '_blank');
            }
        });

        // Insert webview before the refresh button
        const refreshBtn = this.webviewContainer.querySelector('.ai-chat-refresh-btn');
        this.webviewContainer.insertBefore(webview, refreshBtn);
    }

    private refreshWebview(): void {
        const webview = this.webviewContainer.querySelector('webview') as any;
        if (webview) {
            webview.reload();
        }
    }

    private showError(message: string): void {
        const existingWebview = this.webviewContainer.querySelector('webview');
        if (existingWebview) {
            existingWebview.remove();
        }

        // Keep refresh button, add error before it
        const refreshBtn = this.webviewContainer.querySelector('.ai-chat-refresh-btn');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-chat-error';
        errorDiv.innerHTML = `<p>${message}</p>`;

        const retryBtn = document.createElement('button');
        retryBtn.textContent = 'Retry';
        retryBtn.className = 'ai-chat-btn ai-chat-retry-btn';
        retryBtn.addEventListener('click', () => {
            errorDiv.remove();
            this.createWebview();
        });
        errorDiv.appendChild(retryBtn);

        this.webviewContainer.insertBefore(errorDiv, refreshBtn);
    }

    async onClose(): Promise<void> {
        this.webviewContainer?.empty();
    }
}

class AIChatSettingTab extends PluginSettingTab {
    plugin: AIChatSidebarPlugin;

    constructor(app: App, plugin: AIChatSidebarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'AI Chat Sidebar Settings' });

        // Default provider
        new Setting(containerEl)
            .setName('Default Provider')
            .setDesc('The AI provider to load when opening the sidebar')
            .addDropdown(dropdown => {
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

        containerEl.createEl('h3', { text: 'Toolbar Providers' });
        containerEl.createEl('p', {
            text: 'Choose which 3 AI providers appear in the bottom toolbar for quick switching.',
            cls: 'setting-item-description'
        });

        // Toolbar slot 1
        new Setting(containerEl)
            .setName('Toolbar Slot 1')
            .addDropdown(dropdown => {
                for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
                    dropdown.addOption(key, `${provider.icon} ${provider.name}`);
                }
                dropdown.setValue(this.plugin.settings.toolbarProviders[0] || 'gemini');
                dropdown.onChange(async (value) => {
                    this.plugin.settings.toolbarProviders[0] = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshAllViews();
                });
            });

        // Toolbar slot 2
        new Setting(containerEl)
            .setName('Toolbar Slot 2')
            .addDropdown(dropdown => {
                for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
                    dropdown.addOption(key, `${provider.icon} ${provider.name}`);
                }
                dropdown.setValue(this.plugin.settings.toolbarProviders[1] || 'chatgpt');
                dropdown.onChange(async (value) => {
                    this.plugin.settings.toolbarProviders[1] = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshAllViews();
                });
            });

        // Toolbar slot 3
        new Setting(containerEl)
            .setName('Toolbar Slot 3')
            .addDropdown(dropdown => {
                for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
                    dropdown.addOption(key, `${provider.icon} ${provider.name}`);
                }
                dropdown.setValue(this.plugin.settings.toolbarProviders[2] || 'claude');
                dropdown.onChange(async (value) => {
                    this.plugin.settings.toolbarProviders[2] = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshAllViews();
                });
            });
    }
}

export default class AIChatSidebarPlugin extends Plugin {
    settings!: AIChatSettings;

    async onload(): Promise<void> {
        await this.loadSettings();

        // Register the AI Chat view
        this.registerView(VIEW_TYPE_AI_CHAT, (leaf) => new AIChatView(leaf, this));

        // Add settings tab
        this.addSettingTab(new AIChatSettingTab(this.app, this));

        // Add ribbon icon to open AI Chat sidebar
        this.addRibbonIcon('message-circle', 'Open AI Chat', () => {
            this.activateView();
        });

        // Add command to open AI Chat sidebar
        this.addCommand({
            id: 'open-ai-chat-sidebar',
            name: 'Open AI Chat',
            callback: () => {
                this.activateView();
            }
        });

        // Add command to toggle AI Chat sidebar
        this.addCommand({
            id: 'toggle-ai-chat-sidebar',
            name: 'Toggle AI Chat',
            callback: () => {
                this.toggleView();
            }
        });

        console.log('AI Chat Sidebar plugin loaded');
    }

    async onunload(): Promise<void> {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_AI_CHAT);
        console.log('AI Chat Sidebar plugin unloaded');
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    updateOpenViews(): void {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_AI_CHAT);
        leaves.forEach(leaf => {
            const view = leaf.view as AIChatView;
            if (view && view.updateProvider) {
                view.updateProvider(this.settings.defaultProvider);
            }
        });
    }

    refreshAllViews(): void {
        // Detach and reactivate views to rebuild toolbar with new settings
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_AI_CHAT);
        if (leaves.length > 0) {
            leaves.forEach(leaf => leaf.detach());
            this.activateView();
        }
    }

    async activateView(): Promise<void> {
        const { workspace } = this.app;

        let leaf = workspace.getLeavesOfType(VIEW_TYPE_AI_CHAT)[0];

        if (!leaf) {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                leaf = rightLeaf;
                await leaf.setViewState({
                    type: VIEW_TYPE_AI_CHAT,
                    active: true,
                });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async toggleView(): Promise<void> {
        const { workspace } = this.app;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_AI_CHAT);

        if (leaves.length > 0) {
            leaves.forEach(leaf => leaf.detach());
        } else {
            await this.activateView();
        }
    }
}
