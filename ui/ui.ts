import { tailwindToCSS } from 'tw-to-css'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

export const { twi, twj } = tailwindToCSS({
  config: {
    theme: {
      fontFamily: {
        body: ['SF Pro Text'],
      },
      extend: {
        colors: {
          background: 'hsl(0, 0%, 8%)',
          foreground: 'hsl(0, 0%, 98%)',
          primary: {
            DEFAULT: 'hsl(221, 100%, 50%)',
            foreground: 'hsl(0, 0%, 100%)',
          },
          secondary: {
            DEFAULT: 'hsl(0, 0%, 35%)',
            foreground: 'hsl(0, 0%, 100%)',
          },
          muted: {
            DEFAULT: 'hsl(0, 0%, 14.9%)',
            foreground: 'hsl(0, 0%, 63.9%)',
          },
        },
      },
    },
  },
})

const sfProRoundedRegularFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Rounded-Regular.ttf'),
)

const sfProRoundedSemiboldFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Rounded-Semibold.ttf'),
)

const sfProRoundedBoldFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Rounded-Bold.ttf'),
)

const sfProTextRegularFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Text-Regular.ttf'),
)

const sfProTextSemiboldFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Text-Semibold.ttf'),
)

const sfProTextBoldFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Text-Bold.ttf'),
)

export const fonts = async (): Promise<any> => {
  const [
    sfProRoundedRegularFontData,
    sfProRoundedSemiboldFontData,
    sfProRoundedBoldFontData,
    sfProTextRegularFontData,
    sfProTextSemiboldFontData,
    sfProTextBoldFontData,
  ] = await Promise.all([
    sfProRoundedRegularFont,
    sfProRoundedSemiboldFont,
    sfProRoundedBoldFont,
    sfProTextRegularFont,
    sfProTextSemiboldFont,
    sfProTextBoldFont,
  ])
  return [
    {
      name: 'SF Pro Rounded',
      weight: 400,
      data: sfProRoundedRegularFontData,
    },
    {
      name: 'SF Pro Rounded',
      weight: 600,
      data: sfProRoundedSemiboldFontData,
    },
    {
      name: 'SF Pro Rounded',
      weight: 800,
      data: sfProRoundedBoldFontData,
    },
    {
      name: 'SF Pro Text',
      weight: 400,
      data: sfProTextRegularFontData,
    },
    {
      name: 'SF Pro Text',
      weight: 600,
      data: sfProTextSemiboldFontData,
    },
    {
      name: 'SF Pro Text',
      weight: 800,
      data: sfProTextBoldFontData,
    },
  ]
}

export const formatter = Intl.NumberFormat('en', {
  notation: 'standard',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

export const compactFormatter = Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})
