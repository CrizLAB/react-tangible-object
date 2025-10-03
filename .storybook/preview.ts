import type { Preview } from '@storybook/react'
import React from 'react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    actions: { disable: true } ,
    interactions: { disable: true },
    options: {
      storySort: {
        order: ['GettingStarted', '*'], // This moves "GettingStarted" folder to the top
      },
    },
  }
};

export default preview;