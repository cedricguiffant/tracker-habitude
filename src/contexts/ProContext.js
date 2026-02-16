import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRO_KEY = '@pixelhabit_is_pro';
const FREE_HABIT_LIMIT = 3;

const ProContext = createContext({
  isPro: false,
  setIsPro: () => {},
  FREE_HABIT_LIMIT,
  canAddHabit: () => true,
  // Replace this with RevenueCat purchase flow later
  restorePurchase: async () => {},
});

export function ProProvider({ children }) {
  const [isPro, setIsProState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PRO_KEY)
      .then((val) => {
        if (val === 'true') setIsProState(true);
      })
      .catch((e) => console.warn('AsyncStorage read error:', e));
  }, []);

  const setIsPro = useCallback(async (value) => {
    setIsProState(value);
    await AsyncStorage.setItem(PRO_KEY, value ? 'true' : 'false');
  }, []);

  const canAddHabit = useCallback(
    (currentCount) => isPro || currentCount < FREE_HABIT_LIMIT,
    [isPro]
  );

  // Stub: simulate restoring a purchase
  const restorePurchase = useCallback(async () => {
    // TODO: replace with RevenueCat
    //   const customerInfo = await Purchases.restorePurchases();
    //   const isActive = customerInfo.entitlements.active['pro'];
    //   setIsPro(!!isActive);
    return false;
  }, []);

  return (
    <ProContext.Provider
      value={{ isPro, setIsPro, FREE_HABIT_LIMIT, canAddHabit, restorePurchase }}
    >
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  return useContext(ProContext);
}
