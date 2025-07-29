(function() {
  // Helper function to convert Markdown to HTML using Marked.
  function convertMarkdown(text, isBotMessage = false) {
    if (window.marked) {
      try {
        if (isBotMessage) {
          // Create custom renderer for bot messages to open links in new tab
          const renderer = new marked.Renderer();
          renderer.link = function(href, title, text) {
            return `<a href="${href}"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener noreferrer">${text}</a>`;
          };
          return typeof marked.parse === "function" 
            ? marked.parse(text, { renderer }) 
            : marked(text, { renderer });
        } else {
          // Regular conversion for non-bot messages
          return typeof marked.parse === "function" 
            ? marked.parse(text) 
            : marked(text);
        }
      } catch (e) {
        console.error("Error converting markdown:", e);
        return text;
      }
    }
    console.warn("Marked library not loaded.");
    return text;
  }

  // Main initialization function
  function initChatWidget() {
    // Load Geist font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
    document.head.appendChild(fontLink);

    // Chat Widget Styles (enhanced with animations, responsiveness, and better UX)
    const styles = `
      .n8n-chat-widget {
        --chat--color-primary: var(--n8n-chat-primary-color, #854fff);
        --chat--color-secondary: var(--n8n-chat-secondary-color, #6b3fd4);
        --chat--color-background: var(--n8n-chat-background-color, #ffffff);
        --chat--color-font: var(--n8n-chat-font-color, #333333);
        font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }

      .n8n-chat-widget .chat-container {
        position: fixed;
        bottom: 90px;
        right: 20px;
        z-index: 1000;
        display: none;
        width: 380px;
        min-height: 400px;
        max-height: 80vh;
        background: var(--chat--color-background);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(133, 79, 255, 0.15);
        border: 1px solid rgba(133, 79, 255, 0.2);
        overflow: hidden;
        font-family: inherit;
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
      }

      .n8n-chat-widget .chat-container.position-left {
        right: auto;
        left: 20px;
      }

      .n8n-chat-widget .chat-container.open {
        display: flex;
        flex-direction: column;
        opacity: 1;
        transform: translateY(0);
      }

      .n8n-chat-widget .brand-header {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid rgba(133, 79, 255, 0.1);
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--chat--color-background);
      }

      .n8n-chat-widget .close-button {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--chat--color-font);
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s, transform 0.2s;
        font-size: 24px;
        opacity: 0.6;
      }

      .n8n-chat-widget .close-button:hover {
        opacity: 1;
        transform: scale(1.1);
      }

      .n8n-chat-widget .brand-header img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }

      .n8n-chat-widget .brand-header span {
        font-size: 18px;
        font-weight: 600;
        color: var(--chat--color-font);
      }

      .n8n-chat-widget .chat-interface {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0; /* Crucial fix for flex container */
      }

      .n8n-chat-widget .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: var(--chat--color-background);
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 0; /* Crucial fix for scrolling */
      }

      .n8n-chat-widget .chat-message {
        padding: 12px 16px;
        margin: 0;
        border-radius: 12px;
        max-width: 80%;
        word-wrap: break-word;
        font-size: 14px;
        line-height: 1.5;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }

      .n8n-chat-widget .chat-message.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .n8n-chat-widget .chat-message.user {
        background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
        color: white;
        align-self: flex-end;
        box-shadow: 0 4px 12px rgba(133, 79, 255, 0.2);
      }

      .n8n-chat-widget .chat-message.bot {
        background: var(--chat--color-background);
        border: 1px solid rgba(133, 79, 255, 0.2);
        color: var(--chat--color-font);
        align-self: flex-start;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      .n8n-chat-widget .chat-message.loading {
        background: rgba(133, 79, 255, 0.1);
        color: var(--chat--color-font);
        align-self: flex-start;
        display: flex;
        align-items: center;
        gap: 4px;
        font-style: italic;
      }

      .n8n-chat-widget .chat-message.loading::after {
        content: '';
        width: 6px;
        height: 6px;
        background: var(--chat--color-primary);
        border-radius: 50%;
        animation: loading-dots 1.5s infinite;
      }

      @keyframes loading-dots {
        0%, 20% { transform: translateY(0); }
        40% { transform: translateY(-4px); }
        60% { transform: translateY(0); }
        80% { transform: translateY(-2px); }
        100% { transform: translateY(0); }
      }

      .n8n-chat-widget .chat-input {
        padding: 16px;
        background: var(--chat--color-background);
        border-top: 1px solid rgba(133, 79, 255, 0.1);
        display: flex;
        gap: 8px;
      }

      .n8n-chat-widget .chat-input textarea {
        flex: 1;
        padding: 12px;
        border: 1px solid rgba(133, 79, 255, 0.2);
        border-radius: 8px;
        background: var(--chat--color-background);
        color: var(--chat--color-font);
        font-family: inherit;
        font-size: 14px;
        min-height: 40px;
        max-height: 120px;
        resize: none;
        overflow-y: auto;
        transition: border-color 0.2s;
      }

      .n8n-chat-widget .chat-input textarea:focus {
        border-color: var(--chat--color-primary);
        outline: none;
      }

      .n8n-chat-widget .chat-input textarea::placeholder {
        color: var(--chat--color-font);
        opacity: 0.6;
      }

      .n8n-chat-widget .chat-input button {
        background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0 20px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: inherit;
        font-weight: 500;
      }

      .n8n-chat-widget .chat-input button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(133, 79, 255, 0.3);
      }

      .n8n-chat-widget .chat-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(133, 79, 255, 0.3);
        z-index: 999;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      }

      .n8n-chat-widget .chat-toggle.position-left {
        right: auto;
        left: 20px;
      }

      .n8n-chat-widget .chat-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(133, 79, 255, 0.4);
        animation: none;
      }

      .n8n-chat-widget .chat-toggle svg {
        width: 28px;
        height: 28px;
        fill: currentColor;
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      /* Markdown-specific styling */
      .n8n-chat-widget .chat-message p {
        margin: 0 0 8px 0;
      }
      .n8n-chat-widget .chat-message em {
        font-style: italic;
      }
      .n8n-chat-widget .chat-message strong {
        font-weight: bold;
      }
      .n8n-chat-widget .chat-message a {
        color: var(--chat--color-primary);
        text-decoration: underline;
      }
      .n8n-chat-widget .chat-message ul, .n8n-chat-widget .chat-message ol {
        margin: 8px 0;
        padding-left: 20px;
      }

      /* Responsive design */
      @media (max-width: 480px) {
        .n8n-chat-widget .chat-container {
          width: calc(100% - 40px);
          max-width: calc(100% - 40px);
          min-height: auto;
          max-height: 80vh;
          bottom: 20px;
          right: 20px;
          left: 20px;
          border-radius: 16px;
        }
        .n8n-chat-widget .chat-toggle {
          bottom: 16px;
          right: 16px;
        }
        .n8n-chat-widget .chat-container.position-left {
          right: 20px;
          left: auto;
        }
        .n8n-chat-widget .chat-toggle.position-left {
          right: auto;
          left: 16px;
        }
        .n8n-chat-widget .chat-container.open ~ .chat-toggle {
          display: none;
        }
      }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Default configuration (removed poweredBy)
    const defaultConfig = {
      webhook: {
        url: '',
        route: ''
      },
      branding: {
        logo: '',
        name: ''
      },
      style: {
        primaryColor: '#854fff',
        secondaryColor: '#6b3fd4',
        position: 'right',
        backgroundColor: '#ffffff',
        fontColor: '#333333'
      }
    };

    // Merge user configuration with defaults
    const config = window.ChatWidgetConfig
      ? {
          webhook: { ...defaultConfig.webhook, ...window.ChatWidgetConfig.webhook },
          branding: { ...defaultConfig.branding, ...window.ChatWidgetConfig.branding },
          style: { ...defaultConfig.style, ...window.ChatWidgetConfig.style }
        }
      : defaultConfig;

    // Prevent multiple initializations
    if (window.N8NChatWidgetInitialized) return;
    window.N8NChatWidgetInitialized = true;

    let currentSessionId = '';

    // Create widget elements
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'n8n-chat-widget';

    // Set CSS variables
    widgetContainer.style.setProperty('--n8n-chat-primary-color', config.style.primaryColor);
    widgetContainer.style.setProperty('--n8n-chat-secondary-color', config.style.secondaryColor);
    widgetContainer.style.setProperty('--n8n-chat-background-color', config.style.backgroundColor);
    widgetContainer.style.setProperty('--n8n-chat-font-color', config.style.fontColor);

    const chatContainer = document.createElement('div');
    chatContainer.className = `chat-container${config.style.position === 'left' ? ' position-left' : ''}`;

    // Simplified HTML without welcome screen
    const widgetHTML = `
      <div class="brand-header">
        <img src="${config.branding.logo}" alt="${config.branding.name}">
        <span>${config.branding.name}</span>
        <button class="close-button">×</button>
      </div>
      <div class="chat-interface">
        <div class="chat-messages"></div>
        <div class="chat-input">
          <textarea placeholder="Type your message here..." rows="1"></textarea>
          <button type="submit">Send</button>
        </div>
      </div>
    `;

    chatContainer.innerHTML = widgetHTML;

    const toggleButton = document.createElement('button');
    toggleButton.className = `chat-toggle${config.style.position === 'left' ? ' position-left' : ''}`;
    toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.476 0-2.886-.313-4.156-.878l-3.156.586.586-3.156A7.962 7.962 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
      </svg>`;

    widgetContainer.appendChild(chatContainer);
    widgetContainer.appendChild(toggleButton);
    document.body.appendChild(widgetContainer);

    // Element references
    const brandHeader = chatContainer.querySelector('.brand-header');
    const messagesContainer = chatContainer.querySelector('.chat-messages');
    const textarea = chatContainer.querySelector('textarea');
    const sendButton = chatContainer.querySelector('button[type="submit"]');
    const closeButtons = chatContainer.querySelectorAll('.close-button');

    // Auto-resize textarea
    function autoResizeTextarea() {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    textarea.addEventListener('input', autoResizeTextarea);

    // Generate UUID
    function generateUUID() {
      return crypto.randomUUID();
    }

    // Add message with animation and ensure auto-scroll
    function addMessage(content, className) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `chat-message ${className}`;
      
      // Determine if it's a bot message (including loading messages)
      const isBotMessage = className.includes('bot');
      messageDiv.innerHTML = convertMarkdown(content, isBotMessage);
      
      messagesContainer.appendChild(messageDiv);
      setTimeout(() => {
        messageDiv.classList.add('visible');
        // Always scroll to bottom when adding a new message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 10);
    }

    // Show loading indicator
    function showLoading() {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'chat-message bot loading visible';
      loadingDiv.innerHTML = 'Writing...';
      messagesContainer.appendChild(loadingDiv);
      // Scroll to bottom to show loading indicator
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return loadingDiv;
    }

    // Remove loading indicator
    function removeLoading(loadingDiv) {
      if (loadingDiv) loadingDiv.remove();
      // Ensure scroll position is maintained at bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Start new conversation
    async function startNewConversation() {
      currentSessionId = generateUUID();
      const data = [{
        action: "loadPreviousSession",
        sessionId: currentSessionId,
        route: config.webhook.route,
        metadata: { userId: "" }
      }];

      const loadingDiv = showLoading();

      try {
        const response = await fetch(config.webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const responseData = await response.json();
        removeLoading(loadingDiv);

        const botMessageContent = Array.isArray(responseData)
          ? responseData[0].output
          : responseData.output;
        addMessage(botMessageContent, 'bot');
      } catch (error) {
        removeLoading(loadingDiv);
        console.error('Error starting conversation:', error);
        addMessage('Sorry, something went wrong. Please try again.', 'bot');
      }
    }

    // Send message
    async function sendMessage(message) {
      if (!message) return;

      addMessage(message, 'user');

      const messageData = {
        action: "sendMessage",
        sessionId: currentSessionId,
        route: config.webhook.route,
        chatInput: message,
        metadata: { userId: "" }
      };

      const loadingDiv = showLoading();

      try {
        const response = await fetch(config.webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData)
        });

        const data = await response.json();
        removeLoading(loadingDiv);

        const botMessageContent = Array.isArray(data) ? data[0].output : data.output;
        addMessage(botMessageContent, 'bot');
      } catch (error) {
        removeLoading(loadingDiv);
        console.error('Error sending message:', error);
        addMessage('Sorry, something went wrong. Please try again.', 'bot');
      }
    }

    // Event listeners
    sendButton.addEventListener('click', () => {
      const message = textarea.value.trim();
      if (message) {
        sendMessage(message);
        textarea.value = '';
        autoResizeTextarea();
      }
    });

    textarea.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = textarea.value.trim();
        if (message) {
          sendMessage(message);
          textarea.value = '';
          autoResizeTextarea();
        }
      }
    });

    toggleButton.addEventListener('click', () => {
      chatContainer.classList.toggle('open');
      if (chatContainer.classList.contains('open') && !currentSessionId) {
        startNewConversation();
      }
      // Ensure scroll on open if chat is active
      setTimeout(() => {
        if (chatContainer.classList.contains('open')) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 300);
    });

    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        chatContainer.classList.remove('open');
      });
    });
  }

  // Load Marked library
  const markedScript = document.createElement('script');
  markedScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js';
  markedScript.onload = initChatWidget;
  markedScript.onerror = () => console.error("Failed to load Marked library.");
  document.head.appendChild(markedScript);
})();
