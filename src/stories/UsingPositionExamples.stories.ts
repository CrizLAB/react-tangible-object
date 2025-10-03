import type { Meta, StoryObj } from '@storybook/react';

import {UsingPositionExampleTO} from "./UsingPositionExample";

const meta: Meta<typeof UsingPositionExampleTO> = {
  title: 'Examples/UsingPositionExamples',
  component: UsingPositionExampleTO,
  args : {
    precision : 100,
    touchHandlingMode : "Standard"
  },
  argTypes: {
    mode: {
      control: false,
      table: {
        disable: true,
      },
    },
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

type Story = StoryObj<typeof UsingPositionExampleTO>;

export const UsingPositionExample: Story = {
  args:  {
    mode: 'Collision'
  },
  name: "Collision detection"
};

export const PolygonExample: Story = {
  args:  {
    mode: 'Polygon'},
  name: "Polygon"
};

