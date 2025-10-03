import type { Meta, StoryObj } from '@storybook/react';

import {UsingRotationExampleTO} from "./UsingRotationExample";

const meta: Meta<typeof UsingRotationExampleTO> = {
  title: 'Examples/UsingRotationExamples',
  component: UsingRotationExampleTO,
  args : {
    precision : 100,
    touchHandlingMode : "Standard"
  },
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
    previewTabs: {
      "storybook/controls/panel": { hidden: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UsingRotationExampleTO>;

export const UsingRotationExample: Story = {
  name: "Circular progress bar"
};
