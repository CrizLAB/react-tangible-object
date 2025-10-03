import type { Meta, StoryObj } from '@storybook/react';
import { TOCalibration } from './Calibration';

const meta: Meta<typeof TOCalibration> = {
  title: 'GettingStarted/Calibration',
  component: TOCalibration,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
    previewTabs: {
      "storybook/controls/panel": { hidden: false },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TOCalibration>;

export const Calibration: Story = {};