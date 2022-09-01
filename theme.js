import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
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