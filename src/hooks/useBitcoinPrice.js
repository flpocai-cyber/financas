import { useState, useEffect } from 'react';

export const useBitcoinPrice = () => {
    const [btcData, setBtcData] = useState({ brl: null, usd: null, change24h: null, lastUpdated: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const res = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd&include_24hr_change=true',
                    { headers: { 'Accept': 'application/json' } }
                );
                if (!res.ok) throw new Error('CoinGecko error');
                const data = await res.json();
                setBtcData({ brl: data.bitcoin.brl, usd: data.bitcoin.usd, change24h: data.bitcoin.usd_24h_change, lastUpdated: new Date() });
            } catch {
                try {
                    const res2 = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
                    const data2 = await res2.json();
                    const usdPrice = parseFloat(data2.data.amount);
                    let rate = 5.8;
                    try {
                        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
                        const rateData = await rateRes.json();
                        rate = rateData.rates?.BRL || 5.8;
                    } catch { }
                    setBtcData({ brl: usdPrice * rate, usd: usdPrice, change24h: null, lastUpdated: new Date() });
                } catch (e2) { console.error('Failed to fetch BTC price', e2); }
            } finally { setLoading(false); }
        };
        fetchPrice();
        const interval = setInterval(fetchPrice, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return { btcData, loading };
};
