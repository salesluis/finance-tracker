/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
    theme: {
        extend: {
            colors: { surface: '#18181b', panel: '#202023', line: '#303034' },
            boxShadow: { glow: '0 18px 60px rgba(0,0,0,.28)' },
        },
    },
    plugins: [],
}
