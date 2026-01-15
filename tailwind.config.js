/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#ff4b60", // Tinder-ish Pink/Red
                secondary: "#424242",
                light: "#f3f3f3"
            }
        },
    },
    plugins: [],
}
