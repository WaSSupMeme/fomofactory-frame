import { createSystem, colors, units } from 'frog/ui'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

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

const sfProDisplayRegularFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Display-Medium.ttf'),
)

const sfProDisplaySemiboldFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Display-Bold.ttf'),
)

const sfProDisplayBoldFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Display-Heavy.ttf'),
)

export const fonts = async (): Promise<any> => {
  const [
    sfProRoundedRegularFontData,
    sfProRoundedSemiboldFontData,
    sfProRoundedBoldFontData,
    sfProTextRegularFontData,
    sfProTextSemiboldFontData,
    sfProTextBoldFontData,
    sfProDisplayRegularFontData,
    sfProDisplaySemiboldFontData,
    sfProDisplayBoldFontData,
  ] = await Promise.all([
    sfProRoundedRegularFont,
    sfProRoundedSemiboldFont,
    sfProRoundedBoldFont,
    sfProTextRegularFont,
    sfProTextSemiboldFont,
    sfProTextBoldFont,
    sfProDisplayRegularFont,
    sfProDisplaySemiboldFont,
    sfProDisplayBoldFont,
  ])
  return {
    'SF Pro Rounded': [
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
    ],
    'SF Pro Text': [
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
    ],
    'SF Pro Display': [
      {
        name: 'SF Pro Display',
        weight: 400,
        data: sfProDisplayRegularFontData,
      },
      {
        name: 'SF Pro Display',
        weight: 600,
        data: sfProDisplaySemiboldFontData,
      },
      {
        name: 'SF Pro Display',
        weight: 800,
        data: sfProDisplayBoldFontData,
      },
    ],
  }
}

export const {
  Box,
  Columns,
  Column,
  Divider,
  Icon,
  Image,
  Heading,
  HStack,
  Rows,
  Row,
  Spacer,
  Text,
  VStack,
  vars,
} = createSystem({
  fonts: await fonts(),
  colors: {
    ...colors.dark,
    background: '#000000',
    invert: '#0051FF',
    text: '#FAFAFA',
    text100: '#595959',
    text200: '#262626',
  },
  units: {
    ...units,
  },
})

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
