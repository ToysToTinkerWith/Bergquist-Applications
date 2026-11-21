import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  typography: {
    fontFamily: '"Outfit", Arial, sans-serif',
    h1: { fontWeight: 500 },
    h2: { fontWeight: 500 },
    h3: { fontWeight: 500 },
    button: { letterSpacing: 0 },
  },
  palette: {
    primary: {
      main: "#6C63FF",
    },
    secondary: {
      main: "#FF6584",
    },
  },
  
})

theme = responsiveFontSizes(theme)

export default theme
