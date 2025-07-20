import dotenv from 'dotenv';
import { Client, Wallet, xrpToDrops } from 'xrpl';
dotenv.config();

// Configuration
interface Config {
  server: string;
  walletSecret?: string;
  botWallets?: string;
  currencyName: string;
  baseCurrency: string;
  baseIssuer: string;
  pairXRP: string;
  xrpAmount: number;
  delay: number;
  spreadPercentage: number;
}

interface BotParams {
    tradingPair: string,
    baseAmount: string,
    spread: string,
    orderAmount: string,
    refreshInterval: string,
    maxPosition: string,
    stopLoss: string,
    takeProfit: string,
    server: string,
    minOrderSize: string,
  }

const config: Config = {
  server: 'wss://xrplcluster.com',            //'wss://s.devnet.rippletest.net:51233', // XRP Devnet
  walletSecret: process.env.NEXT_PUBLIC_RECIPIENT_WALLET_SECRET_KEY,
  botWallets: process.env.NEXT_PUBLIC_WALLETS,
  currencyName: 'srfx',
  baseCurrency: '7372667800000000000000000000000000000000',
  baseIssuer: 'rDgBV9WrwJ3WwtRWhkekMhDas3muFeKvoS',
  pairXRP: 'XRP',
  xrpAmount: 0.01,
  delay: 6, // Time between each iteration
  spreadPercentage: 0.01 // 1% spread
};
const client = new Client(config.server);

let botTimeoutId: NodeJS.Timeout | null = null;

function getWalletData(): string[] {
  return config.botWallets ? config.botWallets.replace(/\s+/g, "").split(",") : [];
}

export async function startBot(botParams: BotParams): Promise<void> {
  try {
    await client.connect();
    console.log('Connected to XRP Ledger');
    runBotLoop(botParams);
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

async function runBotLoop(botParams: BotParams): Promise<void> {
    console.log('Running bot loop')
    const walletData = getWalletData();
    // console.log('walletData=> ', walletData)
    for (const seed of walletData) {
        await oneProcess(seed, botParams);
    }
    botTimeoutId = setTimeout(() => runBotLoop(botParams), config.delay * 1000);
}

export async function stopBot(botStatus: string): Promise<void> {
  if (botTimeoutId) {
    clearTimeout(botTimeoutId);
    botTimeoutId = null;
  }
  await client.disconnect();
  console.log('Bot stopped and disconnected from XRP Ledger.');
}

async function oneProcess(seed: string, botParams: BotParams): Promise<void> {
  const wallet: Wallet = Wallet.fromSeed(seed);
  console.log(`Using wallet: ${wallet.address}`);

  const balances: number = await client.getXrpBalance(wallet.address);
  console.log('Wallet balances:', balances);
  const balanceLimit = !botParams.stopLoss ? 3 : botParams.stopLoss
  console.log("wallet balance Limit => ", balanceLimit)

  if (balances < Number(balanceLimit)) {
    console.log('Not enough XRP for trading.');
    return;
  }

  try {
    await runVolumeStrategy(wallet, botParams);
  } catch (error: any) {
    console.error('Error in main loop:', error.message);
  }
}

async function runVolumeStrategy(wallet: Wallet, botParams: BotParams): Promise<void> {
  try {
    await getOffers(wallet);
    let currentPrice: number;
    currentPrice = await getAmmPrice(
      config.baseCurrency,
      config.pairXRP,
      config.baseIssuer,
      ""
    );

    console.log(`Current market price: ${currentPrice} ${config.currencyName}/${config.pairXRP}`);

    // Place orders
    await placeOffer(wallet, 'sell', currentPrice, botParams);
    await placeOffer(wallet, 'buy', currentPrice, botParams);
    await cancelAllOffer(wallet);
    await getOffers(wallet);
  } catch (error) {
    console.error('Error in strategy execution:', error);
    throw error;
  }
}

type OfferType = 'buy' | 'sell';

async function placeOffer(wallet: Wallet, type: OfferType, currentPrice: number, botParams: BotParams): Promise<any> {
//   const baseAmount: number = Number(botParams.baseAmount); 
  console.log('current srfx price =>', currentPrice) 
  const xrpAmount: number = Number(botParams.baseAmount);
  const spread_rate: number = type === 'buy' ? (1 - (Number(botParams.spread)/100)) : (1 + (Number(botParams.spread)/100))
  console.log('spread_rate =>', spread_rate)
  const tradingPrice: number = currentPrice * spread_rate;
  const finalTradingAmount: number = xrpAmount * tradingPrice;
  // Convert amount to integer
  const amount: string = (Math.floor(finalTradingAmount)).toString();
  // const amount: string = finalTradingAmount.toFixed(2).toString();
  console.log('srfx amount is ', amount)


  console.log(`Placing ${type} offer for ${amount} ${config.currencyName} with ${xrpAmount} XRP`);

  try {
    const tx: any = {
      TransactionType: 'OfferCreate',
      Account: wallet.address,
      TakerGets: type === 'buy'
        ? xrpToDrops(xrpAmount) // XRP in drops
        : {
            currency: config.baseCurrency,
            issuer: config.baseIssuer,
            value: amount
          },
      TakerPays: type === 'buy'

        ? {
            currency: config.baseCurrency,
            issuer: config.baseIssuer,
            value: amount
          }
        : xrpToDrops(xrpAmount), // XRP in drops
    };

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      console.log(`${type} offer placed at price ${amount}(srfx per 1XRP):`, result.result.meta.TransactionResult);
    } else {
      console.log(`${type} offer placed at price ${amount}(srfx per 1XRP):`, result.result.meta);
    }
    return result;
  } catch (error) {
    console.error(`Error placing ${type} offer:`, error);
    throw error;
  }
}

export async function getAmmPrice(
  asset1: string,
  asset2: string,
  issuer1: string,
  issuer2: string
): Promise<number> {
  try {
    if (!client.isConnected()) {
        await client.connect();
    }
    const assetObj1 = asset1 === "XRP"
      ? { currency: "XRP" }
      : { currency: asset1, issuer: issuer1 as string };
    const assetObj2 = asset2 === "XRP"
      ? { currency: "XRP" }
      : { currency: asset2, issuer: issuer2 as string };

    const ammRequest: any = {
      command: "amm_info",
      asset: assetObj1,
      asset2: assetObj2
    };

    // Remove issuer property for XRP assets to match the expected type
    if (assetObj1.currency === "XRP") {
      delete (ammRequest.asset as any).issuer;
    }
    if (assetObj2.currency === "XRP") {
      delete (ammRequest.asset2 as any).issuer;
    }

    console.log("ammRequest=>",ammRequest)

    const response: any = await client.request(ammRequest);
    console.log("AMM Info Response:", response);

    if (response.result.amm) {
      const pool1 = response.result.amm.amount;
      const pool2 = response.result.amm.amount2;
      const price = parseFloat(String(pool1.value * 1000000)) / parseFloat(pool2);
      console.log(`AMM Price for ${config.currencyName}/${asset2}:`, price);
      return price;
    } else {
      throw new Error("AMM not found");
    }
  } catch (error) {
    console.error("Error fetching AMM price:", error);
    throw error;
  }
}

interface Offer {
  seq: number;
  [key: string]: any;
}

async function getOffers(wallet: Wallet): Promise<Offer[] | undefined> {
  try {
    const offers = await client.request({
      command: "account_offers",
      account: wallet.address,
      ledger_index: "validated"
    });

    console.log("Offers :", offers.result.offers);
    return offers.result.offers || [];
  } catch (err) {
    console.error('Error fetching offers:', err);
  }
  await client.disconnect();
}

async function cancelOffer(wallet: Wallet, offerId: number): Promise<any> {
  try {
    const tx: any = {
      TransactionType: 'OfferCancel',
      Account: wallet.address,
      OfferSequence: offerId,
    };
    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      console.log('Offer cancelled:', result.result.meta.TransactionResult);
    } else {
      console.log('Offer cancelled:', result.result.meta);
    }
    return result;
  } catch (error) {
    console.error('Error cancelling offer:', error);
    throw error;
  }
}

async function cancelAllOffer(wallet: Wallet): Promise<void> {
  try {
    const offers = await getOffers(wallet);
    if (!offers || offers.length === 0) {
      console.log('No offers to cancel');
      return;
    }

    for (const offer of offers) {
      const offerId = offer.seq;
      console.log(`Cancelling offer ${offerId}`);
      await cancelOffer(wallet, offerId);
    }
  } catch (error) {
    console.error('Error cancelling all offers:', error);
  }
}