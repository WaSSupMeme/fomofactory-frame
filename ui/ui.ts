import { createSystem, colors, units } from 'frog/ui'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

const sfProRoundedBoldFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Rounded-Bold.ttf'),
)

const sfProTextBoldFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Text-Bold.ttf'),
)

const sfProDisplayBoldFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'SF-Pro-Display-Heavy.ttf'),
)

const asgardWideFont = fs.readFile(
  path.join(path.resolve(process.cwd(), 'public'), 'Asgard-WideFat.ttf'),
)

export const fonts = async (): Promise<any> => {
  const [
    sfProRoundedBoldFontData,
    sfProTextBoldFontData,
    sfProDisplayBoldFontData,
    asgardWideFontData,
  ] = await Promise.all([
    sfProRoundedBoldFont,
    sfProTextBoldFont,
    sfProDisplayBoldFont,
    asgardWideFont,
  ])
  return {
    'Asgard Wide': [
      {
        name: 'Asgard Wide',
        data: asgardWideFontData,
      },
    ],
    'SF Pro Rounded': [
      {
        name: 'SF Pro Rounded',
        data: sfProRoundedBoldFontData,
      },
    ],
    'SF Pro Text': [
      {
        name: 'SF Pro Text',
        data: sfProTextBoldFontData,
      },
    ],
    'SF Pro Display': [
      {
        name: 'SF Pro Display',
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
