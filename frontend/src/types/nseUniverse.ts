import nseMasterScrips from '../data/nse_universe.json';

export interface NSEInstrument {
  symbol: string;
  name: string;
  type: string;
  sector: string;
  series?: string;
  isin?: string;
  lot_size?: number;
}

// Complete official universe of 2,630+ active NSE equities and benchmark indices
export const NSE_UNIVERSE: NSEInstrument[] = nseMasterScrips as NSEInstrument[];

// Fast O(1) symbol lookup index
export const NSE_SYMBOL_MAP = new Map<string, NSEInstrument>(
  NSE_UNIVERSE.map(item => [item.symbol.toUpperCase(), item])
);
