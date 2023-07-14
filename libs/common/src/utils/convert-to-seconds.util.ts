export const convertToSeconds = (value: string): number => {
  if (!isNaN(value as any)) {
    return parseInt(value);
  }

  let multiplier: number;

  switch (value[value.length - 1]) {
    case 's': {
      multiplier = 1;
      break;
    }
    case 'm': {
      multiplier = 60;
      break;
    }
    case 'h': {
      multiplier = 60 * 60;
      break;
    }
    case 'd': {
      multiplier = 60 * 60 * 24;
      break;
    }

    case 'm': {
      multiplier = 60 * 60 * 24 * 30;
      break;
    }

    case 'y': {
      multiplier = 60 * 60 * 24 * 365;
      break;
    }

    default: {
      throw new Error('invalid time string');
    }
  }
  return parseInt(value.slice(0, -1)) * multiplier;
};
