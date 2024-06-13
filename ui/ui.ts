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
