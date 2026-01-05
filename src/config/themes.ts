// All theme values in HSL format (H S% L%)
export interface ThemeColors {
  id: string;
  name: string;
  primary: string;
  accent: string;
  gradient: string; // CSS gradient for preview
}

export const APP_THEMES: ThemeColors[] = [
  {
    id: 'purple-blue',
    name: 'Roxo & Azul',
    primary: '268 90% 60%',
    accent: '215 95% 65%',
    gradient: 'linear-gradient(135deg, hsl(268 90% 60%), hsl(215 95% 65%))',
  },
  {
    id: 'red-orange',
    name: 'Vermelho & Laranja',
    primary: '0 85% 55%',
    accent: '25 95% 55%',
    gradient: 'linear-gradient(135deg, hsl(0 85% 55%), hsl(25 95% 55%))',
  },
  {
    id: 'green-teal',
    name: 'Verde & Turquesa',
    primary: '145 70% 45%',
    accent: '175 75% 45%',
    gradient: 'linear-gradient(135deg, hsl(145 70% 45%), hsl(175 75% 45%))',
  },
  {
    id: 'pink-purple',
    name: 'Rosa & Roxo',
    primary: '330 85% 60%',
    accent: '280 80% 60%',
    gradient: 'linear-gradient(135deg, hsl(330 85% 60%), hsl(280 80% 60%))',
  },
  {
    id: 'blue-cyan',
    name: 'Azul & Ciano',
    primary: '210 90% 55%',
    accent: '185 85% 50%',
    gradient: 'linear-gradient(135deg, hsl(210 90% 55%), hsl(185 85% 50%))',
  },
  {
    id: 'orange-yellow',
    name: 'Laranja & Amarelo',
    primary: '25 95% 55%',
    accent: '45 95% 55%',
    gradient: 'linear-gradient(135deg, hsl(25 95% 55%), hsl(45 95% 55%))',
  },
  {
    id: 'indigo-violet',
    name: 'Índigo & Violeta',
    primary: '240 80% 60%',
    accent: '290 75% 55%',
    gradient: 'linear-gradient(135deg, hsl(240 80% 60%), hsl(290 75% 55%))',
  },
  {
    id: 'teal-emerald',
    name: 'Turquesa & Esmeralda',
    primary: '175 75% 40%',
    accent: '160 70% 45%',
    gradient: 'linear-gradient(135deg, hsl(175 75% 40%), hsl(160 70% 45%))',
  },
  {
    id: 'rose-red',
    name: 'Rosa & Vermelho',
    primary: '350 85% 60%',
    accent: '0 75% 55%',
    gradient: 'linear-gradient(135deg, hsl(350 85% 60%), hsl(0 75% 55%))',
  },
  {
    id: 'amber-brown',
    name: 'Âmbar & Marrom',
    primary: '38 90% 55%',
    accent: '25 70% 45%',
    gradient: 'linear-gradient(135deg, hsl(38 90% 55%), hsl(25 70% 45%))',
  },
  {
    id: 'cyan-blue',
    name: 'Ciano & Azul',
    primary: '190 90% 50%',
    accent: '220 85% 60%',
    gradient: 'linear-gradient(135deg, hsl(190 90% 50%), hsl(220 85% 60%))',
  },
  {
    id: 'lime-green',
    name: 'Lima & Verde',
    primary: '85 75% 50%',
    accent: '140 65% 45%',
    gradient: 'linear-gradient(135deg, hsl(85 75% 50%), hsl(140 65% 45%))',
  },
  {
    id: 'fuchsia-pink',
    name: 'Fúcsia & Rosa',
    primary: '300 80% 55%',
    accent: '340 85% 60%',
    gradient: 'linear-gradient(135deg, hsl(300 80% 55%), hsl(340 85% 60%))',
  },
];

export function getThemeById(id: string): ThemeColors {
  return APP_THEMES.find((t) => t.id === id) || APP_THEMES[0];
}

/**
 * Generate CSS variables for a given theme (dark mode values)
 */
export function generateThemeCssVars(theme: ThemeColors): Record<string, string> {
  return {
    '--primary': theme.primary,
    '--accent': theme.accent,
    '--ring': theme.primary,
    '--sidebar-primary': theme.primary,
    '--sidebar-ring': theme.primary,
    '--chart-1': theme.primary,
    '--chart-2': theme.accent,
  };
}
