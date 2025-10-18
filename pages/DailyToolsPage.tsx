import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Cake, ArrowRightLeft, ArrowLeftRight } from 'lucide-react';
import ToolCard from '../components/ToolCard';
import { getCurrencyRates } from '../services/apiService';
import { CurrencyData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const AgeCalculator: React.FC = () => {
    const [birthDate, setBirthDate] = useState<string>('');
    const [age, setAge] = useState<string | null>(null);
    const { t } = useLanguage();

    const calculateAge = () => {
        if (!birthDate) {
            setAge(t('tools.age.selectDate'));
            return;
        }
        const today = new Date();
        const birth = new Date(birthDate);

        if (birth > today) {
            setAge(t('tools.age.futureDate'));
            return;
        }

        let years = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            years--;
        }
        setAge(`${t('tools.age.result')} ${years} ${t('tools.age.yearsOld')}.`);
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">{t('tools.age.dobLabel')}</label>
                <input
                    id="birthdate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    aria-label="Date of Birth"
                />
            </div>
            <button
                onClick={calculateAge}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
            >
                {t('tools.calculate')}
            </button>
            {age && (
                <div className="mt-4 p-4 bg-light text-primary rounded-md text-center font-semibold">
                    {age}
                </div>
            )}
        </div>
    );
};

const CurrencyConverter: React.FC = () => {
    const [ratesData, setRatesData] = useState<CurrencyData | null>(null);
    const [amount, setAmount] = useState<number>(1);
    const [fromCurrency, setFromCurrency] = useState<string>('USD');
    const [toCurrency, setToCurrency] = useState<string>('EUR');
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchRates = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getCurrencyRates('USD');
                setRatesData(data);
            } catch (err) {
                console.error("Failed to fetch currency rates:", err);
                setError(t('tools.currency.loadError'));
            } finally {
                setLoading(false);
            }
        };
        fetchRates();
    }, [t]);

    const handleConvert = useCallback(() => {
        if (ratesData && ratesData.rates) {
            const rateFrom = fromCurrency === ratesData.base ? 1 : ratesData.rates[fromCurrency];
            const rateTo = toCurrency === ratesData.base ? 1 : ratesData.rates[toCurrency];
            
            if (rateFrom && rateTo) {
                const convertedAmount = (amount / rateFrom) * rateTo;
                setResult(`${amount} ${fromCurrency} = ${convertedAmount.toFixed(4)} ${toCurrency}`);
            } else {
                 setResult(t('tools.currency.rateError'));
            }
        }
    }, [amount, fromCurrency, toCurrency, ratesData, t]);
    
    useEffect(() => {
        if (ratesData) {
            handleConvert();
        }
    }, [amount, fromCurrency, toCurrency, ratesData, handleConvert]);

    const currencies = useMemo(() => {
        if (!ratesData?.rates) return [];
        return [ratesData.base, ...Object.keys(ratesData.rates)];
    }, [ratesData]);
    
    const handleSwapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    if (loading) return <p className="text-center text-gray-medium">{t('tools.currency.loading')}</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!ratesData) return null;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-3">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">{t('tools.currency.amount')}</label>
                    <input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>
                <div>
                    <label htmlFor="fromCurrency" className="block text-sm font-medium text-gray-700">{t('tools.currency.from')}</label>
                    <select id="fromCurrency" value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex items-end justify-center">
                    <button onClick={handleSwapCurrencies} className="p-2 rounded-full hover:bg-light transition-colors" aria-label={t('tools.currency.swap')}>
                        <ArrowLeftRight className="h-5 w-5 text-gray-600"/>
                    </button>
                </div>
                <div>
                    <label htmlFor="toCurrency" className="block text-sm font-medium text-gray-700">{t('tools.currency.to')}</label>
                    <select id="toCurrency" value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            {result && (
                 <div className="mt-4 p-4 bg-light text-primary rounded-md text-center font-semibold text-lg">
                    {result}
                </div>
            )}
        </div>
    );
};

const DailyToolsPage: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-dark">{t('nav.dailyTools')}</h1>
            <p className="text-gray-medium">{t('tools.description')}</p>

            <div className="grid grid-cols-1 gap-8">
                <ToolCard title={t('tools.age.title')} icon={<Cake className="w-6 h-6" />}>
                    <AgeCalculator />
                </ToolCard>
                <ToolCard title={t('tools.currency.title')} icon={<ArrowRightLeft className="w-6 h-6" />}>
                    <CurrencyConverter />
                </ToolCard>
            </div>
        </div>
    );
};

export default DailyToolsPage;