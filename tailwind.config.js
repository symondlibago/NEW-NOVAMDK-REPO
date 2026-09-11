/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
	  "./src/**/*.{js,jsx,ts,tsx}",
	  "./public/index.html"
	],
	theme: {
	  extend: {
		fontFamily: {
			sans: ['"DM Sans"', 'sans-serif'],
			serif: ['"Libre Baskerville"', 'serif'],
			brand: ['"Playfair Display"', 'serif'],
			baskerville: ['"Libre Baskerville"', 'serif'],
		  },
		borderRadius: {
		  lg: 'var(--radius)',
		  md: 'calc(var(--radius) - 2px)',
		  sm: 'calc(var(--radius) - 4px)',
          '2xl': '1rem',
          '3xl': '1.5rem',
          '4xl': '2rem',
          'full': '9999px',
		},
		colors: {
		  background: 'hsl(var(--background))',
		  foreground: 'hsl(var(--foreground))',
          brand: {
            light: '#e8f5ed',
            DEFAULT: '#22c55e', 
            dark: '#166534'
          },
		  card: {
			DEFAULT: 'hsl(var(--card))',
			foreground: 'hsl(var(--card-foreground))'
		  },
		  popover: {
			DEFAULT: 'hsl(var(--popover))',
			foreground: 'hsl(var(--popover-foreground))'
		  },
		  primary: {
			DEFAULT: 'hsl(var(--primary))',
			foreground: 'hsl(var(--primary-foreground))'
		  },
		  secondary: {
			DEFAULT: 'hsl(var(--secondary))',
			foreground: 'hsl(var(--secondary-foreground))'
		  },
		  muted: {
			DEFAULT: 'hsl(var(--muted))',
			foreground: 'hsl(var(--muted-foreground))'
		  },
		  accent: {
			DEFAULT: 'hsl(var(--accent))',
			foreground: 'hsl(var(--accent-foreground))'
		  },
		  border: 'hsl(var(--border))',
		  input: 'hsl(var(--input))',
		  ring: 'hsl(var(--ring))',
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
};