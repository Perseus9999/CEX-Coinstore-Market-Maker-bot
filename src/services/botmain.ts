import dotenv from 'dotenv';
import { Client, Wallet, xrpToDrops, OfferCreateFlags } from 'xrpl';
dotenv.config();

// Configuration
interface Config {
  server: string;
  botWallets?: string;
  currencyName: string;
  baseCurrency: string;
  baseIssuer: string;
  pairXRP: string;
  delay: number;
}

interface BotParams {
    tradingPair: string,
    baseAmount: string,
    spread: string,
    orderAmount: string,
    refreshInterval: string,
    stopLoss: string,
    takeProfit: string,
    server: string,
  }

const config: Config = {
  server: 'wss://xrplcluster.com',            //'wss://s.devnet.rippletest.net:51233', // XRP Devnet
  botWallets: process.env.NEXT_PUBLIC_WALLETS,
  currencyName: process.env.NEXT_PUBLIC_BASE_CURRENCY_NAME || 'srfx',
  baseCurrency: process.env.NEXT_PUBLIC_BASE_CURRENCY || "7372667800000000000000000000000000000000",
  baseIssuer: process.env.NEXT_PUBLIC_BASEISSUER || "rDgBV9WrwJ3WwtRWhkekMhDas3muFeKvoS",
  pairXRP: 'XRP',
  delay: 6, // Time between each iteration
};
const client = new Client(config.server);

let botTimeoutId: NodeJS.Timeout | null = null;
let count: number = 0;

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
    const revertWalletData = walletData.slice().reverse();
    console.log('count=> ', count)
    for (const seed of count % 2 == 0 ? walletData : revertWalletData) {
        const index = count % 2 == 0 ? walletData.indexOf(seed) : revertWalletData.indexOf(seed);
        await oneProcess(seed, botParams, index);
    }
    count++;
    botTimeoutId = setTimeout(() => runBotLoop(botParams), config.delay * 1000);
}

export async function stopBot(botStatus: string): Promise<void> {
  if (botTimeoutId) {
    clearTimeout(botTimeoutId);
    botTimeoutId = null;
  }
  count = 0;
  await client.disconnect();
  console.log('Bot stopped and disconnected from XRP Ledger.');
}

async function oneProcess(seed: string, botParams: BotParams, walletIndex: number): Promise<void> {
  const wallet: Wallet = Wallet.fromSeed(seed);
  console.log(`Using wallet: ${wallet.address}`);

  const balances: number = await client.getXrpBalance(wallet.address);
  console.log('Wallet balances:', balances);
  const balanceLimit = !botParams.stopLoss ? 3 : botParams.stopLoss
  // console.log("wallet balance Limit => ", balanceLimit)

  if (balances < Number(balanceLimit)) {
    console.log('Not enough XRP for trading.');
    return;
  }

  try {
    await runVolumeStrategy(wallet, botParams, walletIndex);
  } catch (error: any) {
    console.error('Error in main loop:', error.message);
  }
}

async function runVolumeStrategy(wallet: Wallet, botParams: BotParams, walletIndex: number): Promise<void> {
  try {
    await getOffers(wallet);
    let currentPrice: number;
    currentPrice = await getAmmPrice(
      config.baseCurrency,
      config.pairXRP,
      config.baseIssuer,
      ""
    );

    console.log(`Current market ${config.currencyName} price: ${currentPrice} ${config.pairXRP}`);

    // Place orders
    await placeOffer(wallet, currentPrice, botParams, walletIndex);
    // await placeBuyOffer(wallet, currentPrice, botParams, 0);
    // await placeSellAllOffer(wallet, currentPrice, botParams, 0);
    // await cancelAllOffer(wallet);
    await getOffers(wallet);
  } catch (error) {
    console.error('Error in strategy execution:', error);
    throw error;
  }
}

type OfferType = 'buy' | 'sell';

async function placeOffer(wallet: Wallet, currentPrice: number, botParams: BotParams, index: number): Promise<any> {
  const type: OfferType = index % 2 == 0 ? "buy" : "sell"
  try {
    const spread = botParams.spread;
    const xrpAmount: number = Number(botParams.baseAmount);
    const amount: string = Math.floor(xrpAmount / (type === 'buy' ? (currentPrice * (1 - Number(spread) / 100)) : (currentPrice * (1 + Number(spread) / 100)))).toString();
    console.log('trading srfx amount =>', amount)
    const tx: any = {
      TransactionType: 'OfferCreate',
      Account: wallet.address,
      TakerGets: type === 'buy' 
        ? {
          currency: config.baseCurrency,
          issuer: config.baseIssuer,
          value: amount
        }
        : xrpToDrops(xrpAmount),
      TakerPays: type === 'buy'
        ? xrpToDrops(xrpAmount)
        : {
          currency: config.baseCurrency,
          issuer: config.baseIssuer,
          value: amount
        },
      Flags: type === 'buy' ? OfferCreateFlags.tfPassive : OfferCreateFlags.tfImmediateOrCancel
    }

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const offer = await client.request({
      command: "account_offers",
      account: wallet.address
    })

    console.log('offer for wallet => ', offer.result.offers?.length)

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

async function placeSellAllOffer(wallet: Wallet, currentPrice: number, botParams: BotParams, index: number): Promise<any> {
  
  let tokenAmount: number = 0
  tokenAmount = await getSelectedTokenBalance(wallet.address, config.baseCurrency, config.baseIssuer) ?? 0
  const tradingPrice: number = currentPrice * (1 - 0.012);
  const xrpAmount: string = (tokenAmount * tradingPrice).toFixed(4);
  console.log('current srfx price =>', (currentPrice)) 
  console.log(`Selling srfx price =>`, (tradingPrice))
  const amount: string = (Math.floor(tokenAmount)).toString();
  if (amount == '0'){
    return
  }
  console.log('srfx amount is ', amount)
  console.log(`Placing sell offer for ${amount} ${config.currencyName} with ${xrpAmount} XRP`);

  try {
    const tx: any = {
      TransactionType: 'OfferCreate',
      Account: wallet.address,
      TakerGets: {
              currency: config.baseCurrency,
              issuer: config.baseIssuer,
              value: amount
            },
      TakerPays: xrpToDrops(xrpAmount),
      Flags: 0,
    };

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const offer = await client.request({
      command: "account_offers",
      account: wallet.address
    })

    console.log('offer for wallet => ', offer.result.offers?.length)

    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      console.log(`Sell offer placed at price ${amount}(srfx per 1XRP):`, result.result.meta.TransactionResult);
    } else {
      console.log(`Sell offer placed at price ${amount}(srfx per 1XRP):`, result.result.meta);
    }
    return result;
  } catch (error) {
    console.error(`Error placing sell offer:`, error);
    throw error;
  }
}

async function placeBuyOffer(wallet: Wallet, currentPrice: number, botParams: BotParams, index: number): Promise<any> {
  try {
    const xrpAmount: number = Number(botParams.baseAmount);
    const amount: string = Math.floor(xrpAmount / (currentPrice * (1 + 0.012))).toString();
    console.log('trading srfx amount =>', amount)
    const tx: any = {
      TransactionType: 'OfferCreate',
      Account: wallet.address,
      TakerGets: xrpToDrops(xrpAmount),
      TakerPays: {
          currency: config.baseCurrency,
          issuer: config.baseIssuer,
          value: amount
        },
      Flags: 0
    }

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const offer = await client.request({
      command: "account_offers",
      account: wallet.address
    })

    console.log('offer for wallet => ', offer.result.offers?.length)

    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      console.log(`Buy offer placed at price ${amount}(srfx per 1XRP):`, result.result.meta.TransactionResult);
    } else {
      console.log(`Buy offer placed at price ${amount}(srfx per 1XRP):`, result.result.meta);
    }
    return result;
  } catch (error) {
    console.error(`Error placing Buy offer:`, error);
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

    // console.log("ammRequest=>",ammRequest)

    const response: any = await client.request(ammRequest);
    // console.log("AMM Info Response:", response);

    if (response.result.amm) {
      const pool1 = response.result.amm.amount;
      const pool2 = response.result.amm.amount2;
      const price = parseFloat(pool2) / parseFloat(String(pool1.value * 1000000));
      // console.log(`AMM Price for ${config.currencyName}/${asset2}:`, price);
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

async function getSelectedTokenBalance(walletAddress: string, currencyCode: string, issuerAddress: string) {
  try {
    const response = await client.request({
      command: "account_lines",
      account: walletAddress
    })
  
    const line = response.result.lines.find(
      l=> l.currency === currencyCode && l.account === issuerAddress
    )
  
    if (line) {
      console.log(`Balance of ${currencyCode}: `, line.balance)
    } else {
      console.log(`No trust line found for ${currencyCode} issued by ${issuerAddress}`)
    }

    return Number(line?.balance)
  } catch (error) {
    console.log(`response error: ${error}`)
  }
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