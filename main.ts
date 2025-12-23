import { ItemView, Plugin, WorkspaceLeaf } from 'obsidian';

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
    }
};

class AIChatView extends ItemView {
    private webviewContainer!: HTMLElement;
    private currentProvider: string = 'gemini';
    private providerButtons: Map<string, HTMLButtonElement> = new Map();

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE_AI_CHAT;
    }

    getDisplayText(): string {
        return 'AI Chat';
    }

    getIcon(): string {
        return 'message-circle';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('ai-chat-sidebar-container');

        // Create header with AI switcher and controls
        const header = container.createEl('div', { cls: 'ai-chat-header' });

        // AI Provider Switcher
        const switcher = header.createEl('div', { cls: 'ai-chat-switcher' });

        for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
            const btn = switcher.createEl('button', {
                cls: `ai-chat-provider-btn ${key === this.currentProvider ? 'active' : ''}`,
                attr: { 'aria-label': provider.name }
            });
            btn.innerHTML = `${provider.icon} ${provider.name}`;
            btn.addEventListener('click', () => this.switchProvider(key));
            this.providerButtons.set(key, btn);
        }

        // Controls
        const controls = header.createEl('div', { cls: 'ai-chat-controls' });

        // Refresh button
        const refreshBtn = controls.createEl('button', {
            cls: 'ai-chat-btn',
            attr: { 'aria-label': 'Refresh' }
        });
        refreshBtn.innerHTML = '🔄';
        refreshBtn.addEventListener('click', () => this.refreshWebview());

        // Open in browser button
        const externalBtn = controls.createEl('button', {
            cls: 'ai-chat-btn',
            attr: { 'aria-label': 'Open in browser' }
        });
        externalBtn.innerHTML = '🔗';
        externalBtn.addEventListener('click', () => {
            window.open(AI_PROVIDERS[this.currentProvider].url, '_blank');
        });

        // Create webview container
        this.webviewContainer = container.createEl('div', { cls: 'ai-chat-webview-container' });

        // Create the webview
        this.createWebview();
    }

    private switchProvider(provider: string): void {
        if (provider === this.currentProvider) return;

        // Update button states
        this.providerButtons.forEach((btn, key) => {
            if (key === provider) {
                btn.addClass('active');
            } else {
                btn.removeClass('active');
            }
        });

        this.currentProvider = provider;
        this.createWebview();
    }

    private createWebview(): void {
        const provider = AI_PROVIDERS[this.currentProvider];

        // Use Electron's webview tag for full browser functionality
        const webview = document.createElement('webview');
        webview.setAttribute('src', provider.url);
        webview.setAttribute('class', 'ai-chat-webview');
        webview.setAttribute('allowpopups', '');
        webview.setAttribute('partition', `persist:${this.currentProvider}`);

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

        this.webviewContainer.empty();
        this.webviewContainer.appendChild(webview);
    }

    private refreshWebview(): void {
        const webview = this.webviewContainer.querySelector('webview') as any;
        if (webview) {
            webview.reload();
        }
    }

    private showError(message: string): void {
        this.webviewContainer.empty();
        const errorDiv = this.webviewContainer.createEl('div', { cls: 'ai-chat-error' });
        errorDiv.createEl('p', { text: message });

        const retryBtn = errorDiv.createEl('button', {
            text: 'Retry',
            cls: 'ai-chat-btn ai-chat-retry-btn'
        });
        retryBtn.addEventListener('click', () => this.createWebview());
    }

    async onClose(): Promise<void> {
        this.webviewContainer?.empty();
    }
}

export default class AIChatSidebarPlugin extends Plugin {
    async onload(): Promise<void> {
        // Register the AI Chat view
        this.registerView(VIEW_TYPE_AI_CHAT, (leaf) => new AIChatView(leaf));

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
