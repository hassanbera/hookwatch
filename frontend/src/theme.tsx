import { MantineProvider, createTheme } from '@mantine/core';
import type { ReactNode } from 'react';
const theme = createTheme({
  primaryColor: 'cyan',
  defaultRadius: 'sm',
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: { fontFamily: 'Inter, system-ui, sans-serif' },
  defaultGradient: { from: 'cyan', to: 'blue' },
});
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} forceColorScheme="dark">
      {children}
    </MantineProvider>
  );
}
