import { Button, Frog, TextInput, parseEther } from 'frog'
import { pinata } from 'frog/hubs'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import { handle } from 'frog/vercel'

import { fonts, formatter, compactFormatter, Spacer, HStack } from '../ui/ui.js'
import { Box, Columns, Column, Heading, Image, VStack, vars } from '../ui/ui.js'
import { State } from '../types/state.js'

import { fomoFactoryAbi, swapRouterAbi } from '../abi/generated.js'
import {
  computeTokenAddress,
  fetchEthUsdAmount,
  fetchTokenData,
  getDeployedToken,
  prepareDeploy,
  resizeImage,
  saveMetadata,
  stateHash,
} from '../util/token.js'

import { FeeAmount } from '@uniswap/v3-sdk'

export const app = new Frog<{ State: Partial<State> }>({
  ui: { vars },
  assetsPath: '/',
  basePath: '/api',
  browserLocation: process.env.VITE_APP_URL,
  initialState: {},
  hub: pinata(),
})

app.frame(
  '/',
  async (c) => {
    return c.res({
      title: 'FomoFactory',
      browserLocation: process.env.VITE_APP_URL,
      image: (
        <Box
          grow
          minHeight="100%"
          alignHorizontal="center"
          alignVertical="center"
          alignItems="center"
          alignContent="center"
          backgroundColor="background"
          padding="32"
        >
          <VStack gap="12" alignHorizontal="center">
            <Image src="/logo.png" height="72" />
            <VStack gap="0" alignHorizontal="center">
              <Heading font="SF Pro Display" weight="800" size="48" tracking="-2" align="center">
                Create your
              </Heading>
              <HStack gap="8" alignHorizontal="center">
                <Heading
                  font="SF Pro Display"
                  weight="800"
                  size="48"
                  tracking="-2"
                  align="center"
                  wrap
                >
                  memecoin
                </Heading>
                <Image src="/base.png" height="42" />
                <Heading
                  font="SF Pro Display"
                  weight="800"
                  size="48"
                  tracking="-2"
                  align="center"
                  color="invert"
                  wrap
                >
                  on Base
                </Heading>
              </HStack>
            </VStack>
            <Spacer size="4" />
            <Heading color="text" size="24" font="SF Pro Display" weight="600" align="center" wrap>
              <span>Deploy a contract, add liquidity and</span>
              <span>bootstrap trading with one click</span>
            </Heading>
          </VStack>
        </Box>
      ),
      intents: [
        <Button action="/coins/create">Get Started</Button>,
        <Button.Link href="https://fomofactory.wtf/top">Top Coins</Button.Link>,
      ],
    })
  },
  {
    fonts,
  },
)

app.frame(
  '/coins/create',
  async (c) => {
    const { deriveState, inputText, buttonValue } = c
    const state = deriveState((previousState) => {
      if (!previousState.salt) {
        previousState.salt = new Date().getTime()
        return
      }
      if (!previousState.name && inputText) {
        previousState.name = inputText
        return
      }
      if (!previousState.symbol && inputText) {
        previousState.symbol = inputText
        return
      }
      if (!previousState.totalSupply && inputText) {
        previousState.totalSupply = parseInt(inputText)
        return
      }
      if (!previousState.image && inputText) {
        previousState.image = inputText
        return
      }
      if (!previousState.firstBuy && inputText) {
        previousState.firstBuy = parseFloat(inputText)
        return
      }
      if (!previousState.firstBuy && buttonValue === '0.001') {
        previousState.firstBuy = 0.001
        return
      }
      if (!previousState.firstBuy && buttonValue === 'skip') {
        previousState.firstBuy = 0
        return
      }
      if (buttonValue === 'back') {
        if (previousState.firstBuy !== undefined) {
          delete previousState.firstBuy
          return
        }
        if (previousState.image) {
          delete previousState.image
          return
        }
        if (previousState.totalSupply) {
          delete previousState.totalSupply
          return
        }
        if (previousState.symbol) {
          delete previousState.symbol
          return
        }
        if (previousState.name) {
          delete previousState.name
          return
        }
      }
    })
    const showDetails = !state.name || !state.symbol || !state.totalSupply
    const showImage =
      state.name &&
      state.symbol &&
      state.totalSupply &&
      !state.image &&
      state.firstBuy === undefined
    const showFirstBuy =
      state.name && state.symbol && state.totalSupply && state.image && state.firstBuy === undefined
    const showSummary =
      state.name && state.symbol && state.totalSupply && state.image && state.firstBuy !== undefined

    const firstBuyTokensFn = async () => {
      if (state.firstBuy) {
        const usdAmount = await fetchEthUsdAmount(state.firstBuy)
        return (usdAmount / Number(process.env.VITE_USD_MARKET_CAP)) * state.totalSupply!!
      }
      return 0
    }

    const firstBuyTokens = await firstBuyTokensFn()

    const intents = []
    const textInputPlaceholder = !state.name
      ? 'Enter your coin name...'
      : !state.symbol
        ? 'Enter your coin symbol...'
        : !state.totalSupply
          ? 'Enter total supply...'
          : showImage
            ? 'Paste image URL...'
            : showFirstBuy
              ? 'Custom amount of ETH (eg 0.01)'
              : undefined
    if (textInputPlaceholder) {
      intents.push(<TextInput placeholder={textInputPlaceholder} />)
    }
    if (!state.name) {
      intents.push(<Button action="/">Back</Button>)
    } else {
      intents.push(<Button value="back">Back</Button>)
    }
    if (showFirstBuy) {
      intents.push(<Button value="0.001">0.001 ETH</Button>)
      intents.push(<Button value="skip">Skip</Button>)
    }
    if (!showSummary) {
      intents.push(<Button value="next">Next</Button>)
    } else {
      intents.push(
        <Button.Transaction target="/deploy" action="/coins/created">
          LFG
        </Button.Transaction>,
      )
    }

    const avatar = state.image
      ? await resizeImage(state.image, 96, `${stateHash(state)}.png`)
      : '/doge.png'

    const details = (
      <Box
        grow
        minHeight="100%"
        alignHorizontal="center"
        alignVertical="center"
        alignItems="center"
        alignContent="center"
        backgroundColor="background"
        padding="32"
        paddingTop="64"
        gap="32"
      >
        <Heading color="text" size="32" font="SF Pro Display" weight="800" align="center">
          Let's get some details about your coin
        </Heading>
        <Columns gap="8" grow width="100%" paddingLeft="96" paddingRight="96">
          <Column alignHorizontal="left" gap="12">
            <Heading
              color={!state.name ? 'invert' : 'text'}
              size="24"
              font="SF Pro Display"
              weight="600"
              align="center"
              wrap
            >
              Name
            </Heading>
            <Heading
              color={state.name && !state.symbol ? 'invert' : 'text'}
              size="24"
              font="SF Pro Display"
              weight="600"
              align="center"
              wrap
            >
              Symbol
            </Heading>
            <Heading
              color={state.name && state.symbol && !state.totalSupply ? 'invert' : 'text'}
              size="24"
              font="SF Pro Display"
              weight="600"
              align="center"
              wrap
            >
              Total Supply
            </Heading>
          </Column>
          <Column alignHorizontal="right" gap="12">
            <Heading
              color={!state.name ? 'text100' : 'text'}
              size="24"
              font="SF Pro Display"
              weight="600"
              align="center"
              wrap
            >
              {state.name || `eg 'dogwifhat'`}
            </Heading>
            <Heading
              color={!state.symbol ? 'text100' : 'text'}
              size="24"
              font="SF Pro Display"
              weight="600"
              align="center"
              wrap
            >
              {state.symbol || `eg '$WIF'`}
            </Heading>
            <Heading
              color={!state.totalSupply ? 'text100' : 'text'}
              size="24"
              font="SF Pro Display"
              weight="600"
              align="center"
              wrap
            >
              {state.totalSupply ? formatter.format(state.totalSupply) : `eg '420,000,000'`}
            </Heading>
          </Column>
        </Columns>
      </Box>
    )

    const image = (
      <Box
        grow
        minHeight="100%"
        alignHorizontal="center"
        alignVertical="center"
        alignItems="center"
        alignContent="center"
        backgroundColor="background"
        padding="32"
        paddingTop="64"
        gap="32"
      >
        <Heading
          color="text"
          size="32"
          font="SF Pro Display"
          weight="800"
          tracking="-2"
          align="center"
        >
          Let's add a coin picture
        </Heading>
        <Image src="/doge.png" height="128" />
      </Box>
    )

    const firstBuy = (
      <Box
        grow
        minHeight="100%"
        alignHorizontal="center"
        alignVertical="center"
        alignItems="center"
        alignContent="center"
        backgroundColor="background"
        padding="32"
        paddingTop="64"
        gap="32"
      >
        <Heading color="text" size="32" font="SF Pro Display" weight="800" align="center">
          Do you want to make a first buy?
        </Heading>
        <Columns width="100%" alignHorizontal="center" paddingLeft="160" paddingRight="160">
          <Column alignHorizontal="left" gap="4" alignVertical="center">
            <Heading color="text" size="18" font="SF Pro Display" weight="600" align="center" wrap>
              {state.name!!}
            </Heading>
            <Heading
              color="text100"
              size="18"
              font="SF Pro Display"
              weight="600"
              align="center"
              wrap
            >
              {state.symbol!!}
            </Heading>
            <Heading color="text" size="18" font="SF Pro Display" weight="600" align="center" wrap>
              {formatter.format(state.totalSupply!!)}
            </Heading>
          </Column>
          <Column alignHorizontal="right">
            <Image src={avatar} height="96" width="96" borderRadius="8" objectFit="cover" />
          </Column>
        </Columns>
        <Heading
          color="invert"
          size="24"
          font="SF Pro Display"
          weight="600"
          align="center"
          wrap="balance"
        >
          <span>This will make your coin discoverable by DEX</span>
          <span>tools and will give you a head start over snipers</span>
        </Heading>
      </Box>
    )

    const summary = (
      <Box
        grow
        minHeight="100%"
        alignHorizontal="center"
        alignVertical="center"
        alignItems="center"
        alignContent="center"
        backgroundColor="background"
        padding="32"
        paddingTop="64"
        gap="32"
      >
        <Heading color="text" size="32" font="SF Pro Display" weight="800" align="center">
          LFG?
        </Heading>
        <Columns width="100%" alignHorizontal="center" paddingLeft="160" paddingRight="160">
          <Column alignHorizontal="left" gap="4" alignVertical="center">
            <Heading color="text" size="18" font="SF Pro Display" weight="600" align="center" wrap>
              {state.name!!}
            </Heading>
            <Heading
              color="text100"
              size="18"
              font="SF Pro Display"
              weight="600"
              align="center"
              wrap
            >
              {state.symbol!!}
            </Heading>
            <Heading color="text" size="18" font="SF Pro Display" weight="600" align="center" wrap>
              {formatter.format(state.totalSupply!!)}
            </Heading>
          </Column>
          <Column alignHorizontal="right">
            <Image src={avatar} height="96" width="96" borderRadius="8" objectFit="cover" />
          </Column>
        </Columns>
        {state.firstBuy ? (
          <Heading
            color="invert"
            size="24"
            font="SF Pro Display"
            weight="600"
            align="center"
            wrap="balance"
          >
            <span>{`You're getting ~${compactFormatter.format(firstBuyTokens)} ${state.symbol}`}</span>
            <span>as a first buyer</span>
          </Heading>
        ) : (
          <span></span>
        )}
      </Box>
    )

    return c.res({
      title: 'FomoFactory - Mint New Coin',
      browserLocation: `${process.env.VITE_APP_URL}/coins/create`,
      image: showDetails ? details : showImage ? image : showFirstBuy ? firstBuy : summary,
      intents,
    })
  },
  {
    fonts,
  },
)

app.frame(
  '/coins/created',
  async (c) => {
    const { transactionId, deriveState } = c
    const state = await deriveState(async (previousState) => {
      if (!previousState.address && transactionId) {
        previousState.address = await getDeployedToken(transactionId as `0x${string}`)
      }
    })
    const firstBuyUsd = await fetchEthUsdAmount(state.firstBuy || 0)
    const liquidity = Number(process.env.VITE_USD_MARKET_CAP) - firstBuyUsd
    const avatar = state.image
      ? await resizeImage(state.image, 96, `${state.address}.png`)
      : '/doge.png'

    return c.res({
      title: `FomoFactory - ${state.symbol}`,
      browserLocation: `${process.env.VITE_APP_URL}/coins/${state.address}`,
      image: (
        <Box
          grow
          flexDirection="column"
          minHeight="100%"
          alignHorizontal="center"
          alignVertical="center"
          alignItems="center"
          alignContent="center"
          backgroundColor="background"
          padding="32"
          gap="16"
        >
          <Image src="/logo.png" height="72" />
          <Columns width="100%" alignHorizontal="center" paddingLeft="160" paddingRight="160">
            <Column alignHorizontal="left" gap="8" alignVertical="center">
              <Heading
                color="text"
                size="18"
                font="SF Pro Display"
                weight="600"
                tracking="-1"
                align="center"
                wrap
              >
                {state.name}
              </Heading>
              <Heading
                color="text100"
                size="18"
                font="SF Pro Display"
                weight="600"
                tracking="-1"
                align="center"
                wrap
              >
                {state.symbol}
              </Heading>
            </Column>
            <Column alignHorizontal="right">
              <Image src={avatar} height="96" width="96" borderRadius="8" objectFit="cover" />
            </Column>
          </Columns>
          <Columns width="100%" alignHorizontal="center" paddingLeft="160" paddingRight="160">
            <Column alignHorizontal="left" gap="4" alignVertical="center">
              <Heading
                color="invert"
                size="18"
                font="SF Pro Display"
                weight="600"
                tracking="-1"
                align="center"
                wrap
              >
                Liquidity
              </Heading>
              <Heading
                color="invert"
                size="18"
                font="SF Pro Display"
                weight="600"
                tracking="-1"
                align="center"
                wrap
              >
                Market Cap
              </Heading>
              <Heading
                color="invert"
                size="18"
                font="SF Pro Display"
                weight="600"
                tracking="-1"
                align="center"
                wrap
              >
                Volume (24h)
              </Heading>
            </Column>
            <Column alignHorizontal="right" gap="4" alignVertical="center">
              <HStack>
                <Heading
                  color="text100"
                  size="18"
                  font="SF Pro Display"
                  weight="600"
                  tracking="-1"
                  align="center"
                  wrap
                >
                  {`$${compactFormatter.format(liquidity)}`}
                </Heading>
                <Image src="/lock.png" height="16" />
              </HStack>
              <Heading
                color="text100"
                size="18"
                font="SF Pro Display"
                weight="600"
                tracking="-1"
                align="center"
                wrap
              >
                {`$${compactFormatter.format(Number(process.env.VITE_USD_MARKET_CAP))}`}
              </Heading>
              <Heading
                color="text100"
                size="18"
                font="SF Pro Display"
                weight="600"
                tracking="-1"
                align="center"
                wrap
              >
                {`$${compactFormatter.format(firstBuyUsd)}`}
              </Heading>
            </Column>
          </Columns>
        </Box>
      ),
      intents: [
        <TextInput placeholder={'Enter amount in ETH to buy...'} />,
        <Button action="/coins/create">New Coin</Button>,
        <Button.Link href={`https://fomofactory.wtf/coins/${state.address}`}>Chart</Button.Link>,
        <Button.Transaction target={`/buy/${state.address}`} action={`/coins/${state.address}`}>
          Buy
        </Button.Transaction>,
        <Button.Transaction
          target={`/buy/${state.address}/0.01`}
          action={`/coins/${state.address}`}
        >
          0.01 ETH
        </Button.Transaction>,
      ],
    })
  },
  {
    fonts,
  },
)

app.frame(
  '/coins/:address',
  async (c) => {
    const { address } = c.req.param()

    const data = await fetchTokenData(address as `0x${string}`)
    const avatar = data.avatar ? await resizeImage(data.avatar, 96) : '/doge.png'

    return c.res({
      title: `FomoFactory - ${data.symbol}`,
      browserLocation: `${process.env.VITE_APP_URL}/coins/${address}`,
      image: (
        <Box
          grow
          minHeight="100%"
          alignHorizontal="center"
          alignVertical="center"
          alignItems="center"
          alignContent="center"
          backgroundColor="background"
          padding="32"
          gap="16"
        >
          <Image src="/logo.png" height="72" />
          <Columns width="100%" alignHorizontal="center" paddingLeft="160" paddingRight="160">
            <Column alignHorizontal="left" gap="8" alignVertical="center">
              <Heading
                color="text"
                size="18"
                font="SF Pro Display"
                weight="600"
                align="center"
                wrap
              >
                {data.name}
              </Heading>
              <Heading
                color="text100"
                size="18"
                font="SF Pro Display"
                weight="600"
                align="center"
                wrap
              >
                {data.symbol}
              </Heading>
            </Column>
            <Column alignHorizontal="right">
              <Image src={avatar} height="96" width="96" borderRadius="8" objectFit="cover" />
            </Column>
          </Columns>
          <Columns width="100%" alignHorizontal="center" paddingLeft="160" paddingRight="160">
            <Column alignHorizontal="left" gap="4" alignVertical="center">
              <Heading
                color="invert"
                size="18"
                font="SF Pro Display"
                weight="600"
                align="center"
                wrap
              >
                Liquidity
              </Heading>
              <Heading
                color="invert"
                size="18"
                font="SF Pro Display"
                weight="600"
                align="center"
                wrap
              >
                Market Cap
              </Heading>
              <Heading
                color="invert"
                size="18"
                font="SF Pro Display"
                weight="600"
                align="center"
                wrap
              >
                Volume (24h)
              </Heading>
            </Column>
            <Column alignHorizontal="right" gap="4" alignVertical="center">
              <HStack>
                <Heading
                  color="text100"
                  size="18"
                  font="SF Pro Display"
                  weight="600"
                  align="center"
                  wrap
                >
                  {data.liquidity ? `$${compactFormatter.format(data.liquidity)}` : '-'}
                </Heading>
                {data.liquidity ? <Image src="/lock.png" height="16" /> : <br />}
              </HStack>
              <Heading
                color="text100"
                size="18"
                font="SF Pro Display"
                weight="600"
                align="center"
                wrap
              >
                {data.marketCap ? `$${compactFormatter.format(data.marketCap)}` : '-'}
              </Heading>
              <Heading
                color="text100"
                size="18"
                font="SF Pro Display"
                weight="600"
                align="center"
                wrap
              >
                {data.volume?.h24 ? `$${compactFormatter.format(data.volume.h24)}` : '-'}
              </Heading>
            </Column>
          </Columns>
        </Box>
      ),
      intents: [
        <TextInput placeholder={'Enter amount in ETH to buy...'} />,
        <Button action="/coins/create">New Coin</Button>,
        <Button.Link href={`https://fomofactory.wtf/coins/${address}`}>Chart</Button.Link>,
        <Button.Transaction target={`/buy/${address}`}>Buy</Button.Transaction>,
        <Button.Transaction target={`/buy/${address}/0.01`}>0.01 ETH</Button.Transaction>,
      ],
    })
  },
  {
    fonts,
  },
)

app.transaction('/deploy', async (c) => {
  const { previousState: state } = c

  const address = await computeTokenAddress(c.address as `0x${string}`, state as State)
  await saveMetadata(address, state as State)

  const args = await prepareDeploy(state as State)

  // Contract transaction response.
  return c.contract({
    abi: fomoFactoryAbi,
    chainId: 'eip155:8453',
    functionName: 'createMemecoin',
    args: args.args as any,
    to: args.address as `0x${string}`,
    value: args.value,
  })
})

app.transaction('/buy/:address/:amount?', async (c) => {
  const { address, amount } = c.req.param()
  const { inputText } = c

  const ethToSpend = amount || inputText || '0'
  const ethAmount = parseEther(ethToSpend)

  // Contract transaction response.
  return c.contract({
    abi: swapRouterAbi,
    chainId: 'eip155:8453',
    functionName: 'exactInputSingle',
    args: [
      {
        tokenIn: process.env.VITE_WETH_ADDRESS as `0x${string}`,
        tokenOut: address as `0x${string}`,
        fee: FeeAmount.HIGH,
        recipient: c.address as `0x${string}`,
        amountIn: ethAmount,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      },
    ],
    to: process.env.VITE_UNISWAP_V3_SWAP_ROUTER_ADDRESS as `0x${string}`,
    value: ethAmount,
  })
})

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
