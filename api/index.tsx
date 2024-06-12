import { Button, Frog, TextInput, parseEther } from 'frog'
import { pinata } from 'frog/hubs'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import { handle } from 'frog/vercel'

import { twj, fonts, formatter, compactFormatter } from '../ui/ui.js'
import { State } from '../types/state.js'

import { fomoFactoryAbi, swapRouterAbi } from '../abi/generated.js'
import {
  computeTokenAddress,
  fetchEthUsdAmount,
  fetchTokenData,
  getDeployedToken,
  prepareDeploy,
  saveMetadata,
} from '../util/token.js'

import { FeeAmount } from '@uniswap/v3-sdk'

export const app = new Frog<{ State: Partial<State> }>({
  assetsPath: '/',
  basePath: '/api',
  browserLocation: '/:path',
  initialState: {},
  hub: pinata(),
})

app.frame(
  '/',
  async (c) => {
    return c.res({
      image: (
        <div style={twj('flex flex-col grow bg-background font-body items-center justify-center')}>
          <img src="/logo.png" alt="FomoFactory" style={twj('h-32')} />
          <h1
            style={twj(
              'text-foreground text-center text-7xl font-extrabold font-body tracking-tighter',
            )}
          >
            <span>Create your</span>
          </h1>
          <h1
            style={twj(
              '-mt-4 text-foreground text-center text-7xl font-extrabold font-body tracking-tighter',
            )}
          >
            <span>memecoin</span>
            <svg
              style={twj('mx-3 -mt-1 h-16 w-16')}
              viewBox="0 0 111 111"
              preserveAspectRatio="xMinYMin slice"
              fill="none"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z"
                fill="#0052FF"
              />
            </svg>
            <span style={twj('text-primary')}>on Base</span>
          </h1>
          <h3
            style={twj(
              'text-foreground text-center text-4xl font-semibold font-body tracking-tighter w-1/2',
            )}
          >
            Deploy a contract, add liquidity and bootstrap trading with one click
          </h3>
        </div>
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
        if (previousState.firstBuy) {
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
    return c.res({
      image: (
        <div style={twj('flex flex-col grow bg-background font-body items-center justify-center')}>
          {showDetails && (
            <div style={twj('flex flex-col grow items-center justify-center w-full')}>
              <h1
                style={twj(
                  'text-foreground text-center text-7xl font-extrabold font-body tracking-tighter w-3/4',
                )}
              >
                Let's get some details about your coin
              </h1>
              <div style={twj('flex flex-col items-left justify-left w-1/2')}>
                <div style={twj('flex flex-row w-full')}>
                  <h3
                    style={twj(
                      'text-left text-4xl font-semibold font-body',
                      !state.name ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    Name
                  </h3>
                  <div style={twj('flex grow')} />
                  <h3
                    style={twj(
                      'text-left text-4xl font-semibold font-body',
                      !state.name ? 'text-secondary' : 'text-foreground',
                    )}
                  >
                    {state.name || `eg 'dogwifhat'`}
                  </h3>
                </div>
                <div style={twj('flex flex-row w-full')}>
                  <h3
                    style={twj(
                      'text-left text-4xl font-semibold font-body',
                      state.name && !state.symbol ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    Symbol
                  </h3>
                  <div style={twj('flex grow')} />
                  <h3
                    style={twj(
                      'text-left text-4xl font-semibold font-body',
                      !state.symbol ? 'text-secondary' : 'text-foreground',
                    )}
                  >
                    {state.symbol || `eg '$WIF'`}
                  </h3>
                </div>
                <div style={twj('flex flex-row w-full')}>
                  <h3
                    style={twj(
                      'text-left text-4xl font-semibold font-body',
                      state.name && state.symbol && !state.totalSupply
                        ? 'text-primary'
                        : 'text-foreground',
                    )}
                  >
                    Total Supply
                  </h3>
                  <div style={twj('flex grow')} />
                  <h3
                    style={twj(
                      'text-left text-4xl font-semibold font-body',
                      !state.totalSupply ? 'text-secondary' : 'text-foreground',
                    )}
                  >
                    {state.totalSupply ? formatter.format(state.totalSupply) : `eg '420,000,000'`}
                  </h3>
                </div>
              </div>
            </div>
          )}
          {showImage && (
            <div style={twj('flex flex-col grow items-center justify-center w-full gap-y-8')}>
              <h1
                style={twj(
                  'text-foreground text-center text-7xl font-extrabold font-body tracking-tighter',
                )}
              >
                Let's add a coin picture
              </h1>
              <img src="/doge.png" style={twj('h-48 fill-muted')} />
            </div>
          )}
          {showFirstBuy && (
            <div style={twj('flex flex-col grow items-center justify-center w-full gap-y-8')}>
              <h1
                style={twj(
                  'text-foreground text-center text-7xl font-extrabold font-body tracking-tighter',
                )}
              >
                Do you want to make a first buy?
              </h1>
              <h3
                style={twj(
                  'text-primary text-center text-5xl font-extrabold font-body tracking-tighter w-3/4',
                )}
              >
                This will make your coin discoverable by DEX tools and will give you a head start
                over snipers
              </h3>
            </div>
          )}
          {showSummary && (
            <div style={twj('flex flex-col grow items-center justify-center w-full gap-y-8')}>
              <h1
                style={twj(
                  'text-foreground text-center text-7xl font-extrabold font-body tracking-tighter',
                )}
              >
                LFG?
              </h1>
              <div style={twj('flex flex-row items-center justify-center w-1/2')}>
                <div style={twj('flex flex-col')}>
                  <h3 style={twj('text-foreground text-left text-4xl font-semibold font-body')}>
                    {state.name}
                  </h3>
                  <h3 style={twj('text-secondary text-left text-4xl font-semibold font-body')}>
                    {state.symbol}
                  </h3>
                  <h3 style={twj('text-foreground text-left text-4xl font-semibold font-body')}>
                    {formatter.format(state.totalSupply!!)}
                  </h3>
                </div>
                <div style={twj('flex grow')} />
                <img
                  src={state.image}
                  style={twj('aspect-square h-48 w-48 rounded-lg object-cover')}
                />
              </div>
            </div>
          )}
        </div>
      ),
      intents: [
        <TextInput
          placeholder={
            !state.name
              ? 'Enter your coin name...'
              : !state.symbol
                ? 'Enter your coin symbol...'
                : !state.totalSupply
                  ? 'Enter total supply...'
                  : showImage
                    ? 'Paste image URL...'
                    : showFirstBuy
                      ? 'Custom amount of ETH (eg 0.01)'
                      : ''
          }
        />,
        !state.name ? <Button.Reset>Back</Button.Reset> : <Button value="back">Back</Button>,
        showFirstBuy ? <Button value="0.001">0.001 ETH</Button> : null,
        showFirstBuy ? <Button value="skip">Skip</Button> : null,
        !showSummary ? <Button value="next">Next</Button> : null,
        showSummary ? (
          <Button.Transaction target="/deploy" action="/coins/created">
            LFG
          </Button.Transaction>
        ) : null,
      ],
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
    const liquidity = import.meta.env.VITE_USD_MARKET_CAP - firstBuyUsd

    return c.res({
      image: (
        <div style={twj('flex flex-col grow bg-background font-body items-center justify-center')}>
          <img src="/logo.png" alt="FomoFactory" style={twj('h-32')} />
          <div style={twj('flex flex-row items-center justify-center w-1/2')}>
            <div style={twj('flex flex-col')}>
              <h3 style={twj('text-foreground text-left text-4xl font-semibold font-body')}>
                {state.name}
              </h3>
              <h3 style={twj('text-secondary text-left text-4xl font-semibold font-body')}>
                {state.symbol}
              </h3>
            </div>
            <div style={twj('flex grow')} />
            <img src={state.image} style={twj('aspect-square h-48 w-48 rounded-lg object-cover')} />
          </div>
          <div style={twj('flex flex-row items-center gap-0 w-1/2')}>
            <h3 style={twj('text-primary text-left text-4xl font-semibold font-body')}>
              Liquidity
            </h3>
            <div style={twj('flex grow')}></div>
            <h3 style={twj('text-secondary text-left text-4xl font-semibold font-body')}>
              {`$${compactFormatter.format(liquidity)}`}
            </h3>
            <img src="/lock.png" style={twj('-mt-3 h-8')} />
          </div>
          <div style={twj('flex flex-row items-center gap-2 w-1/2')}>
            <h3 style={twj('text-primary text-left text-4xl font-semibold font-body')}>
              Market Cap
            </h3>
            <div style={twj('flex grow')}></div>
            <h3 style={twj('text-secondary text-left text-4xl font-semibold font-body')}>
              {`$${compactFormatter.format(import.meta.env.VITE_USD_MARKET_CAP)}`}
            </h3>
          </div>
          <div style={twj('flex flex-row items-center gap-1 w-1/2')}>
            <h3 style={twj('text-primary text-left text-4xl font-semibold font-body')}>
              Volume (24h)
            </h3>
            <div style={twj('flex grow')}></div>
            <h3 style={twj('text-secondary text-left text-4xl font-semibold font-body')}>
              {`$${compactFormatter.format(firstBuyUsd)}`}
            </h3>
          </div>
        </div>
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

    return c.res({
      image: (
        <div style={twj('flex flex-col grow bg-background font-body items-center justify-center')}>
          <img src="/logo.png" alt="FomoFactory" style={twj('h-32')} />
          <div style={twj('flex flex-row items-center justify-center w-1/2')}>
            <div style={twj('flex flex-col')}>
              <h3 style={twj('text-foreground text-left text-4xl font-semibold font-body')}>
                {data.name}
              </h3>
              <h3 style={twj('text-secondary text-left text-4xl font-semibold font-body')}>
                {data.symbol}
              </h3>
            </div>
            <div style={twj('flex grow')} />
            <img src={data.avatar} style={twj('aspect-square h-48 w-48 rounded-lg object-cover')} />
          </div>
          <div style={twj('flex flex-row items-center gap-0 w-1/2')}>
            <h3 style={twj('text-primary text-left text-4xl font-semibold font-body')}>
              Liquidity
            </h3>
            <div style={twj('flex grow')}></div>
            <h3 style={twj('text-secondary text-left text-4xl font-semibold font-body')}>
              {data.liquidity ? `$${compactFormatter.format(data.liquidity)}` : '-'}
            </h3>
            {data.liquidity && <img src="/lock.png" style={twj('-mt-3 h-8')} />}
          </div>
          <div style={twj('flex flex-row items-center gap-2 w-1/2')}>
            <h3 style={twj('text-primary text-left text-4xl font-semibold font-body')}>
              Market Cap
            </h3>
            <div style={twj('flex grow')}></div>
            <h3 style={twj('text-secondary text-left text-4xl font-semibold font-body')}>
              {data.marketCap ? `$${compactFormatter.format(data.marketCap)}` : '-'}
            </h3>
          </div>
          <div style={twj('flex flex-row items-center gap-1 w-1/2')}>
            <h3 style={twj('text-primary text-left text-4xl font-semibold font-body')}>
              Volume (24h)
            </h3>
            <div style={twj('flex grow')}></div>
            <h3 style={twj('text-secondary text-left text-4xl font-semibold font-body')}>
              {data.volume?.h24 ? `$${compactFormatter.format(data.volume.h24)}` : '-'}
            </h3>
          </div>
        </div>
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
    to: args.address,
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
        tokenIn: import.meta.env.VITE_WETH_ADDRESS,
        tokenOut: address as `0x${string}`,
        fee: FeeAmount.HIGH,
        recipient: c.address as `0x${string}`,
        amountIn: ethAmount,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      },
    ],
    to: import.meta.env.VITE_UNISWAP_V3_SWAP_ROUTER_ADDRESS,
    value: ethAmount,
  })
})

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
