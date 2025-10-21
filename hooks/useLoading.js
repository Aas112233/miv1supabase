import { useState } from 'react';

const useLoading = () => {
  const [loadingStates, setLoadingStates] = useState({});

  const startLoading = (key) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
  };

  const stopLoading = (key) => {
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  };

  const isLoading = (key) => {
    return !!loadingStates[key];
  };

  return { startLoading, stopLoading, isLoading };
};

export default useLoading;