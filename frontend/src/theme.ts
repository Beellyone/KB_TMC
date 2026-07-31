export interface Theme {
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  accentText: string;
  danger: string;
  success: string;
  headerBg: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarActive: string;
  inputBg: string;
  inputBorder: string;
  shadow: string;
}

export const lightTheme: Theme = {
  bg: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceHover: '#E5E5E5',
  border: '#E5E5E5',
  text: '#14213D',
  textSecondary: '#555555',
  accent: '#FCA311',
  accentHover: '#E09200',
  accentText: '#14213D',
  danger: '#E63946',
  success: '#2A9D8F',
  headerBg: '#14213D',
  sidebarBg: '#14213D',
  sidebarText: '#B0B0B0',
  sidebarActive: '#FCA311',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E5E5',
  shadow: '0 1px 3px rgba(20,33,61,0.10)',
};

export const darkTheme: Theme = {
  bg: '#000000',
  surface: '#111111',
  surfaceHover: '#1A1A1A',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#999999',
  accent: '#FCA311',
  accentHover: '#FFB733',
  accentText: '#000000',
  danger: '#FF6B6B',
  success: '#51CF66',
  headerBg: '#0A0A0A',
  sidebarBg: '#0A0A0A',
  sidebarText: '#888888',
  sidebarActive: '#FCA311',
  inputBg: '#111111',
  inputBorder: '#2A2A2A',
  shadow: '0 1px 3px rgba(0,0,0,0.4)',
};
