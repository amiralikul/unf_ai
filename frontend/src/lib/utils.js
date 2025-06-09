import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { camelCase, isArray, isObject, transform } from 'lodash';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const toCamelCase = (obj) => {
  if (!isObject(obj)) {
    return obj;
  }
  return transform(obj, (acc, value, key) => {
    const camelKey = isArray(obj) ? key : camelCase(key);
    acc[camelKey] = toCamelCase(value);
  });
};
