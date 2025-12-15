/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: 'var(--bg-primary)',
                secondary: 'var(--bg-secondary)',
                tertiary: 'var(--bg-tertiary)',
                main: 'var(--text-primary)',
                muted: 'var(--text-secondary)',
                border: 'var(--border-color)',
                accent: 'var(--accent-color)',
                'accent-hover': 'var(--accent-hover)',
            }
        },
    },
    plugins: [],
}
