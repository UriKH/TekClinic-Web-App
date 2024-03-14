import '@mantine/core/styles.css';
import React from 'react';
import { MantineProvider, ColorSchemeScript,createTheme } from '@mantine/core';

export const metadata = {
  title: 'TekClinic',
  description: 'I am using Mantine with Next.js!',
};

const theme = createTheme({
  fontFamily: 'Open Sans, sans-serif',
  primaryColor: 'cyan',
});

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme} forceColorScheme={'light'}>{children}</MantineProvider>
      </body>
    </html>
  );
}