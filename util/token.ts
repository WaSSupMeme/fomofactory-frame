import { State } from '../types/state.js'

import Jimp from 'jimp'

import {
  createPublicClient,
  http,
  formatEther,
  formatUnits,
  hashMessage,
  numberToHex,
  parseEther,
  parseEventLogs,
  parseUnits,
} from 'viem'
import { base } from 'viem/chains'

import { FeeAmount } from '@uniswap/v3-sdk'

import {
  aggregatorV3InterfaceAbi,
  erc20Abi,
  fomoFactoryAbi,
  iUniswapV3FactoryAbi,
  iUniswapV3PoolAbi,
} from '../abi/generated.js'

const avatarFileName = (address: `0x${string}`, imageName: string) => {
  return `${address}.${imageName.split('.').pop()}`
}

const adjustSpacing = (tick: number, spacing: number) => {
  return Math.floor(tick / spacing) * spacing
}

function calculateInitialTick(totalSupply: number, marketCap: number, tickSpacing: number) {
  return adjustSpacing(
    Math.floor(Math.log(Math.sqrt(marketCap / totalSupply)) / Math.log(Math.sqrt(1.0001))),
    tickSpacing,
  )
}

const client = createPublicClient({
  chain: base,
  transport: http(process.env.VITE_RPC_PROVIDER_URL),
})

export const resizeImage = async (image: string, size: number, fileName?: string) => {
  const img = await Jimp.read(image)
  const name = fileName || image.substring(image.lastIndexOf('/') + 1)
  const buffer = await img.cover(size, size).quality(100).getBufferAsync(Jimp.MIME_JPEG)
  const formData = new FormData()
  formData.append('file', new Blob([buffer]), `${name.split('.')[0].substring(22)}.jpg`)
  const resp = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: formData,
  })
  const data = await resp.json()
  const url = data.data.url as string
  const path = `https://tmpfiles.org/dl${url.substring(url.indexOf('tmpfiles.org') + 12)}`
  return path
}

export const stateHash = (state: Partial<State>) => {
  return hashMessage(
    JSON.stringify({
      salt: state.salt,
      name: state.name,
      symbol: state.symbol,
      totalSupply: state.totalSupply,
      image: state.image,
    }),
  ).substring(0, 42) as `0x${string}`
}

export const computeTokenAddress = async (creator: `0x${string}`, state: State) => {
  return await client.readContract({
    address: process.env.VITE_FOMO_FACTORY_ADDRESS as `0x${string}`,
    abi: fomoFactoryAbi,
    functionName: 'computeMemecoinAddress',
    args: [
      creator,
      state.name!!,
      state.symbol!!,
      parseUnits(state.totalSupply!!.toString(), 18),
      numberToHex(state.salt!!, { size: 32 }),
    ],
  })
}

export const saveMetadata = async (address: `0x${string}`, state: State) => {
  const hash = stateHash(state)
  const imageName = state.image.substring(state.image.lastIndexOf('/') + 1)
  const image = new Blob([await (await fetch(state.image)).arrayBuffer()])
  const fileName = avatarFileName(address, imageName)
  const formData = new FormData()
  formData.append('file', image, fileName)
  const data = JSON.stringify({
    name: address,
    keyvalues: {
      fileName: fileName,
      chainId: base.id,
      description: state.name,
      stateHash: hash,
    },
  })
  formData.append('pinataMetadata', data)

  const options = JSON.stringify({
    cidVersion: 0,
    wrapWithDirectory: true,
  })
  formData.append('pinataOptions', options)

  await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VITE_PINATA_JWT}`,
    },
    body: formData,
  })
}

export const fetchUsdEthAmount = async (usdAmount: number) => {
  const [latestRoundData, decimals] = await client.multicall({
    allowFailure: false,
    contracts: [
      {
        address: process.env.VITE_ETH_USD_AGGREGATOR_ADDRESS as `0x${string}`,
        abi: aggregatorV3InterfaceAbi,
        functionName: 'latestRoundData',
      },
      {
        address: process.env.VITE_ETH_USD_AGGREGATOR_ADDRESS as `0x${string}`,
        abi: aggregatorV3InterfaceAbi,
        functionName: 'decimals',
      },
    ],
  })

  const ethPrice = Number(formatUnits(latestRoundData[1], decimals))
  return usdAmount / ethPrice
}

export const fetchEthUsdAmount = async (ethAmount: number) => {
  const [latestRoundData, decimals] = await client.multicall({
    allowFailure: false,
    contracts: [
      {
        address: process.env.VITE_ETH_USD_AGGREGATOR_ADDRESS as `0x${string}`,
        abi: aggregatorV3InterfaceAbi,
        functionName: 'latestRoundData',
      },
      {
        address: process.env.VITE_ETH_USD_AGGREGATOR_ADDRESS as `0x${string}`,
        abi: aggregatorV3InterfaceAbi,
        functionName: 'decimals',
      },
    ],
  })

  const ethPrice = Number(formatUnits(latestRoundData[1], decimals))
  return ethAmount * ethPrice
}

export const prepareDeploy = async (state: State) => {
  const [protocolFeeEth, tickSpacing] = await client.multicall({
    allowFailure: false,
    contracts: [
      {
        address: process.env.VITE_FOMO_FACTORY_ADDRESS as `0x${string}`,
        abi: fomoFactoryAbi,
        functionName: 'protocolFee',
      },
      {
        address: process.env.VITE_UNISWAP_V3_FACTORY_ADDRESS as `0x${string}`,
        abi: iUniswapV3FactoryAbi,
        functionName: 'feeAmountTickSpacing',
        args: [FeeAmount.HIGH],
      },
    ],
  })
  const marketCap = await fetchUsdEthAmount(Number(process.env.VITE_USD_MARKET_CAP!!))
  const protocolFee = Number(formatEther(protocolFeeEth as bigint))
  const totalSupply = parseUnits(state.totalSupply.toString(), 18)
  const value = parseEther((Number(state.firstBuy || 0) + protocolFee).toString())
  const initialTick = calculateInitialTick(state.totalSupply, marketCap, tickSpacing as number)

  return {
    address: process.env.VITE_FOMO_FACTORY_ADDRESS,
    args: [
      state.name,
      state.symbol,
      totalSupply,
      initialTick,
      FeeAmount.HIGH,
      numberToHex(state.salt, { size: 32 }),
    ],
    value,
  }
}

export const getDeployedToken = async (state: Partial<State>) => {
  const hash = stateHash(state)
  console.log(hash)
  const res = await fetch(
    `https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues][stateHash]={"value":"${hash}","op":"eq"}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.VITE_PINATA_JWT}`,
      },
    },
  )

  const resData = (await res.json()) as TokensMetadata
  return resData.rows[0]!!.metadata.name
}

interface TokensMetadata {
  count: number
  rows: {
    ipfs_pin_hash: string
    metadata: {
      name: string
      keyvalues: {
        description: string
        fileName: string
        stateHash: string
        telegram: string
        twitter: string
        website: string
      }
    }
  }[]
}

interface Pool {
  id: string
  attributes: {
    base_token_price_usd: number
    base_token_price_native_currency: number
    quote_token_price_usd: number
    quote_token_price_native_currency: number
    address: string
    transactions: {
      h24: {
        buys: number
        sells: number
      }
    }
    volume_usd: {
      h24: number
    }
    fdv_usd: number
    reserve_in_usd: number
  }
  relationships: {
    base_token: {
      data: {
        id: string
      }
    }
    quote_token: {
      data: {
        id: string
      }
    }
  }
}

interface DexResponse {
  data: Pool
}

interface DexData {
  poolAddress: `0x${string}`
  volume?: {
    h24: number
  }
  liquidity?: number
  marketCap?: number
}

export const fetchTokensDexData = async (address: `0x${string}`) => {
  const [poolAddress] = await client.readContract({
    address: process.env.VITE_FOMO_FACTORY_ADDRESS as `0x${string}`,
    abi: fomoFactoryAbi,
    functionName: 'poolMetadataOf',
    args: [address],
  })

  const response = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/base/pools/${poolAddress}`,
  )

  const resp = (await response.json()) as DexResponse
  const poolData = resp.data
  if (
    !poolData ||
    !poolData.relationships.base_token.data ||
    !poolData.relationships.quote_token.data
  ) {
    return {
      poolAddress,
    } as DexData
  }

  const baseToken = poolData.relationships.base_token.data.id
  const quoteToken = poolData.relationships.quote_token.data.id

  const [tokenBalanceRaw, tokenDecimals, totalSupplyRaw, ethBalanceRaw] = await client.multicall({
    allowFailure: false,
    contracts: [
      {
        address: address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [poolAddress],
      },
      {
        address: address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
      {
        address: address,
        abi: erc20Abi,
        functionName: 'totalSupply',
      },
      {
        address: process.env.VITE_WETH_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [poolAddress],
      },
    ],
  })

  const tokenBalance = Number(formatUnits(tokenBalanceRaw, tokenDecimals))
  const ethBalance = Number(formatEther(ethBalanceRaw))
  const totalSupply = Number(formatUnits(totalSupplyRaw, tokenDecimals))

  const tokenPrice =
    baseToken.toLowerCase() === `base_${address.toLowerCase()}`
      ? poolData.attributes.base_token_price_usd
      : poolData.attributes.quote_token_price_usd
  const ethPrice =
    quoteToken.toLowerCase() === `base_${process.env.VITE_WETH_ADDRESS!!.toLowerCase()}`
      ? poolData.attributes.quote_token_price_usd
      : poolData.attributes.base_token_price_usd

  return {
    poolAddress,
    volume: {
      h24: poolData.attributes.volume_usd.h24,
    },
    liquidity: ethBalance * ethPrice + tokenBalance * tokenPrice,
    marketCap: totalSupply * tokenPrice,
  } as DexData
}

export const fetchTokenMetadata = async (address: `0x${string}`) => {
  const res = await fetch(
    `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=${address}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.VITE_PINATA_JWT}`,
      },
    },
  )

  const resData = (await res.json()) as TokensMetadata
  if (resData.rows.length > 0) {
    const avatar = resData.rows[0]!!
    return {
      avatar: `${process.env.VITE_GATEWAY_URL}/ipfs/${avatar.ipfs_pin_hash}/${avatar.metadata.keyvalues.fileName}`,
      description: avatar.metadata.keyvalues.description,
      telegram: avatar.metadata.keyvalues.telegram,
      twitter: avatar.metadata.keyvalues.twitter,
      website: avatar.metadata.keyvalues.website,
    }
  }
  return undefined
}

export const fetchTokenData = async (address: `0x${string}`) => {
  const [name, symbol, totalSupply, decimals] = await client.multicall({
    allowFailure: false,
    contracts: [
      {
        address,
        abi: erc20Abi,
        functionName: 'name',
      },
      {
        address,
        abi: erc20Abi,
        functionName: 'symbol',
      },
      {
        address,
        abi: erc20Abi,
        functionName: 'totalSupply',
      },
      {
        address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
  })

  const metadata = await fetchTokenMetadata(address)
  const dex = await fetchTokensDexData(address)

  return {
    address,
    name,
    symbol,
    totalSupply: Number(formatUnits(totalSupply, decimals)),
    decimals,
    avatar: metadata?.avatar,
    description: metadata?.description,
    ...dex,
  }
}

export const getSwapData = async (txHash: `0x${string}`) => {
  const receipt = await client.waitForTransactionReceipt({ hash: txHash })

  const logs = parseEventLogs({
    abi: iUniswapV3PoolAbi,
    eventName: 'Swap',
    logs: receipt.logs,
  })

  return logs[0]!.args
}
