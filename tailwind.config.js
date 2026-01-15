import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales
        blue: {
          default: colors.sky[600],  // Color principal para acciones
          light: colors.sky[300],  // Color principal para acciones
          light2: colors.sky[100],  // Color principal para acciones
          hover: colors.sky[800],    // Estado hover para azul
          text: colors.neutral[50],
          'text-op2': colors.neutral[500],
          50: '#EFF6FF',      // Para fondos suaves
        },
        amber: {
          default: colors.yellow[400],  // Color secundario/decorativo
          hover: colors.amber[800],    // Estado hover para amber
          hover2: colors.yellow[500],    // Estado hover para amber
          light: '#FEF3C7',    // Para bordes y fondos suaves
          light2: colors.amber[200],    // Para bordes y fondos suaves
          text: colors.neutral[400],
          'text-op2': colors.neutral[300],
          50: '#FFFBEB',      // Para fondos suaves
        },
        neutral: {
          default: colors.neutral[600],
          text: colors.neutral[500],
          hover: colors.neutral[800],
          bg: colors.neutral[50],
          bg2: colors.neutral[100],
          bg3: colors.neutral[400],
          bg4: colors.neutral[600],
        },
        // Estados
        success: {
          default: colors.green[600],
          light: colors.green[50],
          light2: colors.green[100],
          text: colors.green[800],
          border: colors.green[200],
          border2: colors.green[600],
        },
        error: {
          light: colors.red[50],
          light2: colors.red[200],
          bold: colors.red[600],
          alert: colors.red[400],
          border: colors.red[500],
          hover: colors.red[800],
        }
      },
      // Bordes personalizados
      borderWidth: {
        DEFAULT: '1px',
        'input': '2px',
      },
      // Sombras personalizadas
      boxShadow: {
        'card': '0 2px 4px rgba(0,0,0,0.1)',
        'hover': '0 4px 6px rgba(0,0,0,0.1)',
        'button': '0 1px 2px rgba(0,0,0,0.05)',
      },
      // Transiciones
      transitionDuration: {
        DEFAULT: '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Animaciones
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
      },
      animation: {
        fadeIn: 'fadeIn 200ms ease-in-out',
        slideIn: 'slideIn 200ms ease-in-out',
        slideInRight: 'slideInRight 0.3s ease-out'
      },
      // Espaciado consistente
      spacing: {
        'form': '1.5rem',
        'section': '2rem',
      },
      // Radios de borde
      borderRadius: {
        'card': '0.75rem',
        'input': '0.5rem',
      }
    },
  },
  // Plugins para funcionalidades adicionales
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}