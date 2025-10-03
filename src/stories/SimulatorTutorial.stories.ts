import type { Meta, StoryObj } from '@storybook/react';

import {SimulatorTutorialTO} from "./SimulatorTutorial";

const meta: Meta<typeof SimulatorTutorialTO> = {
  title: 'GettingStarted/SimulatorTutorial',
  component: SimulatorTutorialTO,
  argTypes:{
    tutorialMode: {
      control: false,
      table: {
        disable: true,
      },
    },
    
  },
  
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
    controls: { disable: true },
    previewTabs: {
      "storybook/controls/panel": { hidden: true },
    },
    
  },
};

export default meta;

type Story = StoryObj<typeof SimulatorTutorialTO>;


export const SimulatorTutorialDragAndDrop: Story = {
  name: "Drag and drop to move",
  args:  {
    tutorialMode : "DragAndDrop",
    }
    
};

export const SimulatorTutorialRotation: Story = {
  name: "Scroll to rotate",
  args:  {
    tutorialMode : "Rotation",
  }
};