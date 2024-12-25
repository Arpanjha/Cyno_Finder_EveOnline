// constants/theme.js
export const theme = {
    colors: {
      primary: '#00d8ff',
      secondary: '#00ffcc',
      accent: '#ff4f00',
      background: {
        dark: '#111827',
        darker: '#0a0f1a'
      },
      text: {
        primary: '#ffffff',
        secondary: '#94a3b8',
        accent: '#00d8ff'
      }
    },
    effects: {
      gradients: {
        starfield: 'radial-gradient(ellipse at center, #001d3d, #000000)',
        accent: 'linear-gradient(45deg, #00d8ff, #00ffcc)'
      },
      shadows: {
        glow: '0 0 20px #00d8ff, 0 0 30px #00d8ff',
        subtle: '0 0 15px rgba(0,216,255,0.2)',
        button: '0 0 10px rgba(0,216,255,0.3)'
      }
    },
    transitions: {
      default: 'all 0.2s ease-in-out',
      slow: 'all 0.3s ease-in-out',
      fast: 'all 0.1s ease-in-out'
    }
  };
  
  export const styles = {
    container: {
      position: 'relative',
      minHeight: '100vh',
      fontFamily: '"Orbitron", sans-serif',
      backgroundColor: theme.colors.background.dark,
      color: theme.colors.text.primary
    },
    starfield: {
      position: 'absolute',
      inset: 0,
      background: theme.effects.gradients.starfield,
      backgroundSize: 'cover',
      zIndex: 0
    },
    title: {
      textShadow: theme.effects.shadows.glow,
      color: theme.colors.text.accent
    },
    input: {
      backgroundColor: 'rgba(17, 24, 39, 0.8)',
      border: `2px solid ${theme.colors.primary}`,
      color: theme.colors.text.primary,
      boxShadow: theme.effects.shadows.subtle
    },
    button: {
      primary: {
        backgroundColor: theme.colors.primary,
        color: '#000000',
        fontWeight: 'bold',
        boxShadow: theme.effects.shadows.button,
        transition: theme.transitions.default
      },
      secondary: {
        backgroundColor: 'transparent',
        border: `2px solid ${theme.colors.primary}`,
        color: theme.colors.primary,
        boxShadow: theme.effects.shadows.subtle,
        transition: theme.transitions.default
      }
    }
  };