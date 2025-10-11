
// Ultra-safe validation utilities for Select components

export const isValidSelectValue = (value: any): boolean => {
  console.log('isValidSelectValue - checking:', { value, type: typeof value });
  
  // Reject all problematic values
  if (value === null || value === undefined || value === '') {
    console.log('isValidSelectValue - rejected: null/undefined/empty');
    return false;
  }
  
  try {
    const stringValue = String(value);
    const isValid = stringValue.length > 0 && stringValue.trim().length > 0;
    console.log('isValidSelectValue - result:', { stringValue, isValid });
    return isValid;
  } catch (error) {
    console.error('isValidSelectValue - error during validation:', error);
    return false;
  }
};

export const ensureSafeSelectValue = (value: any, fallback?: string): string => {
  console.log('ensureSafeSelectValue - input:', { value, fallback, type: typeof value });
  
  const createFallback = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 999999);
    const result = fallback && fallback.trim() !== '' ? fallback : `fallback-${timestamp}-${random}`;
    console.log('ensureSafeSelectValue - created fallback:', result);
    return result;
  };
  
  // Handle all problematic cases immediately
  if (
    value === null || 
    value === undefined || 
    value === ''
  ) {
    console.log('ensureSafeSelectValue - using fallback for null/undefined/empty');
    return createFallback();
  }
  
  try {
    const stringValue = String(value);
    if (stringValue === '' || stringValue.trim() === '') {
      console.log('ensureSafeSelectValue - using fallback for empty string after conversion');
      return createFallback();
    }
    console.log('ensureSafeSelectValue - returning safe value:', stringValue);
    return stringValue;
  } catch (error) {
    console.error('ensureSafeSelectValue - error during conversion:', error);
    return createFallback();
  }
};

export const createSafeSelectItems = <T>(
  items: T[],
  valueExtractor: (item: T) => any,
  labelExtractor: (item: T) => string,
  keyPrefix: string = 'item'
): Array<{ key: string; value: string; label: string }> => {
  console.log('createSafeSelectItems - input:', { items, keyPrefix, itemsLength: items?.length });
  
  if (!Array.isArray(items) || items.length === 0) {
    console.log('createSafeSelectItems - returning empty array');
    return [];
  }
  
  return items
    .filter(item => {
      const isValid = item !== null && item !== undefined;
      if (!isValid) {
        console.log('createSafeSelectItems - filtered out null/undefined item');
      }
      return isValid;
    })
    .map((item, index) => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 999999);
      
      try {
        const rawValue = valueExtractor(item);
        const rawLabel = labelExtractor(item);
        
        console.log('createSafeSelectItems - processing item:', { item, rawValue, rawLabel, index });
        
        const safeValue = ensureSafeSelectValue(rawValue, `${keyPrefix}-${index}-${timestamp}`);
        const safeLabel = String(rawLabel || safeValue);
        
        const result = {
          key: `${keyPrefix}-${index}-${timestamp}-${random}`,
          value: safeValue,
          label: safeLabel
        };
        
        console.log('createSafeSelectItems - created safe item:', result);
        return result;
      } catch (error) {
        console.error('createSafeSelectItems - error processing item:', error);
        const errorValue = `${keyPrefix}-error-${index}-${timestamp}`;
        return {
          key: `${keyPrefix}-error-${index}-${timestamp}-${random}`,
          value: errorValue,
          label: errorValue
        };
      }
    });
};

export const filterValidStringArray = (items: string[]): string[] => {
  console.log('filterValidStringArray - input:', items);
  
  if (!Array.isArray(items)) {
    console.log('filterValidStringArray - not an array, returning empty');
    return [];
  }
  
  const result = items
    .filter(item => {
      if (item === null || item === undefined || item === '') {
        console.log('filterValidStringArray - filtered out null/undefined/empty:', item);
        return false;
      }
      try {
        const stringItem = String(item);
        const isValid = stringItem.length > 0 && stringItem.trim().length > 0;
        if (!isValid) {
          console.log('filterValidStringArray - filtered out invalid string:', item);
        }
        return isValid;
      } catch (error) {
        console.error('filterValidStringArray - error processing item:', error);
        return false;
      }
    })
    .map(item => String(item));
  
  console.log('filterValidStringArray - result:', result);
  return result;
};
