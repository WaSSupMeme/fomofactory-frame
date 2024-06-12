import { defineConfig } from '@wagmi/cli'
import { Abi, erc20Abi } from 'viem'

import FomoFactoryABI from './abi/FomoFactory.json'
import SwapRouterABI from './abi/SwapRouter02.json'

import AggregatorV3Interface from '@chainlink/abi/v0.7/interfaces/AggregatorV3Interface.json' assert { type: 'json' }
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json' assert { type: 'json' }

export default defineConfig({
  out: 'abi/generated.ts',
  contracts: [
    {
      name: 'ERC20',
      abi: erc20Abi,
    },
    {
      name: 'FomoFactory',
      abi: FomoFactoryABI as Abi,
    },
    {
      name: 'SwapRouter',
      abi: SwapRouterABI as Abi,
    },
    {
      name: 'AggregatorV3Interface',
      abi: AggregatorV3Interface.abi as Abi,
    },
    {
      name: 'IUniswapV3Factory',
      abi: IUniswapV3FactoryABI.abi as Abi,
    },
  ],
  plugins: [],
})
