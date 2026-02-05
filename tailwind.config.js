/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chat: {
          bg: 'var(--chat-bg, #0f0f14)',
          surface: 'var(--chat-surface, #18181b)',
          border: 'var(--chat-border, #27272a)',
          text: 'var(--chat-text, #fafafa)',
          'text-secondary': 'var(--chat-text-secondary, #a1a1aa)',
          accent: 'var(--chat-accent, #a855f7)',
          'accent-hover': 'var(--chat-accent-hover, #9333ea)',
          success: 'var(--chat-success, #22c55e)',
          warning: 'var(--chat-warning, #f59e0b)',
          error: 'var(--chat-error, #ef4444)',
        }
      }
    },
  },
  plugins: [],
}
