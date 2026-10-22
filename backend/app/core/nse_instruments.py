"""
Comprehensive NSE (National Stock Exchange of India) Equities & Indices Registry.
Provides symbol metadata, full company names, and sector classifications for top NSE traded instruments.
Any arbitrary NSE ticker can also be dynamically looked up via <SYMBOL>.NS.
"""

from typing import List, Dict, Any, Optional

NSE_UNIVERSE: List[Dict[str, Any]] = [
    # Benchmark & Sectoral Indices
    {"symbol": "NIFTY50", "name": "NIFTY 50 Index", "type": "INDEX", "sector": "Benchmark", "lot_size": 50},
    {"symbol": "BANKNIFTY", "name": "NIFTY Bank Index", "type": "INDEX", "sector": "Banking", "lot_size": 15},
    {"symbol": "FINNIFTY", "name": "NIFTY Financial Services", "type": "INDEX", "sector": "Financial", "lot_size": 40},
    {"symbol": "MIDCPNIFTY", "name": "NIFTY Midcap Select", "type": "INDEX", "sector": "Midcap", "lot_size": 75},
    {"symbol": "INDIAVIX", "name": "India Volatility Index", "type": "INDEX", "sector": "Volatility", "lot_size": 1},

    # NIFTY 50 Heavyweights
    {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "type": "EQUITY", "sector": "Energy", "lot_size": 250},
    {"symbol": "TCS", "name": "Tata Consultancy Services Ltd", "type": "EQUITY", "sector": "IT", "lot_size": 175},
    {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd", "type": "EQUITY", "sector": "Banking", "lot_size": 550},
    {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd", "type": "EQUITY", "sector": "Banking", "lot_size": 700},
    {"symbol": "INFY", "name": "Infosys Ltd", "type": "EQUITY", "sector": "IT", "lot_size": 400},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel Ltd", "type": "EQUITY", "sector": "Telecom", "lot_size": 950},
    {"symbol": "ITC", "name": "ITC Ltd", "type": "EQUITY", "sector": "FMCG", "lot_size": 1600},
    {"symbol": "SBIN", "name": "State Bank of India", "type": "EQUITY", "sector": "Banking", "lot_size": 1500},
    {"symbol": "LT", "name": "Larsen & Toubro Ltd", "type": "EQUITY", "sector": "Infrastructure", "lot_size": 300},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Ltd", "type": "EQUITY", "sector": "FMCG", "lot_size": 300},
    {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd", "type": "EQUITY", "sector": "Automobile", "lot_size": 1425},
    {"symbol": "MARUTI", "name": "Maruti Suzuki India Ltd", "type": "EQUITY", "sector": "Automobile", "lot_size": 100},
    {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical Industries Ltd", "type": "EQUITY", "sector": "Pharma", "lot_size": 700},
    {"symbol": "BAJFINANCE", "name": "Bajaj Finance Ltd", "type": "EQUITY", "sector": "Financial", "lot_size": 125},
    {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank Ltd", "type": "EQUITY", "sector": "Banking", "lot_size": 400},
    {"symbol": "AXISBANK", "name": "Axis Bank Ltd", "type": "EQUITY", "sector": "Banking", "lot_size": 625},
    {"symbol": "TITAN", "name": "Titan Company Ltd", "type": "EQUITY", "sector": "Consumer", "lot_size": 175},
    {"symbol": "ASIANPAINT", "name": "Asian Paints Ltd", "type": "EQUITY", "sector": "Consumer", "lot_size": 200},
    {"symbol": "HCLTECH", "name": "HCL Technologies Ltd", "type": "EQUITY", "sector": "IT", "lot_size": 350},
    {"symbol": "WIPRO", "name": "Wipro Ltd", "type": "EQUITY", "sector": "IT", "lot_size": 1500},
    {"symbol": "NTPC", "name": "NTPC Ltd", "type": "EQUITY", "sector": "Power", "lot_size": 1500},
    {"symbol": "POWERGRID", "name": "Power Grid Corporation of India", "type": "EQUITY", "sector": "Power", "lot_size": 1800},
    {"symbol": "ONGC", "name": "Oil & Natural Gas Corporation Ltd", "type": "EQUITY", "sector": "Energy", "lot_size": 3850},
    {"symbol": "COALINDIA", "name": "Coal India Ltd", "type": "EQUITY", "sector": "Mining", "lot_size": 2100},
    {"symbol": "BAJAJFINSV", "name": "Bajaj Finserv Ltd", "type": "EQUITY", "sector": "Financial", "lot_size": 500},
    {"symbol": "M&M", "name": "Mahindra & Mahindra Ltd", "type": "EQUITY", "sector": "Automobile", "lot_size": 350},
    {"symbol": "TATASTEEL", "name": "Tata Steel Ltd", "type": "EQUITY", "sector": "Metals", "lot_size": 5500},
    {"symbol": "JSWSTEEL", "name": "JSW Steel Ltd", "type": "EQUITY", "sector": "Metals", "lot_size": 675},
    {"symbol": "ADANIENT", "name": "Adani Enterprises Ltd", "type": "EQUITY", "sector": "Conglomerate", "lot_size": 300},
    {"symbol": "ADANIPORTS", "name": "Adani Ports and SEZ Ltd", "type": "EQUITY", "sector": "Infrastructure", "lot_size": 400},
    {"symbol": "GRASIM", "name": "Grasim Industries Ltd", "type": "EQUITY", "sector": "Materials", "lot_size": 250},
    {"symbol": "ULTRACEMCO", "name": "UltraTech Cement Ltd", "type": "EQUITY", "sector": "Cement", "lot_size": 100},
    {"symbol": "TECHM", "name": "Tech Mahindra Ltd", "type": "EQUITY", "sector": "IT", "lot_size": 600},
    {"symbol": "EICHERMOT", "name": "Eicher Motors Ltd", "type": "EQUITY", "sector": "Automobile", "lot_size": 175},
    {"symbol": "NESTLEIND", "name": "Nestle India Ltd", "type": "EQUITY", "sector": "FMCG", "lot_size": 40},
    {"symbol": "BRITANNIA", "name": "Britannia Industries Ltd", "type": "EQUITY", "sector": "FMCG", "lot_size": 200},
    {"symbol": "CIPLA", "name": "Cipla Ltd", "type": "EQUITY", "sector": "Pharma", "lot_size": 650},
    {"symbol": "DRREDDY", "name": "Dr. Reddy's Laboratories Ltd", "type": "EQUITY", "sector": "Pharma", "lot_size": 125},
    {"symbol": "DIVISLAB", "name": "Divi's Laboratories Ltd", "type": "EQUITY", "sector": "Pharma", "lot_size": 200},
    {"symbol": "APOLLOHOSP", "name": "Apollo Hospitals Enterprise Ltd", "type": "EQUITY", "sector": "Healthcare", "lot_size": 125},
    {"symbol": "HINDALCO", "name": "Hindalco Industries Ltd", "type": "EQUITY", "sector": "Metals", "lot_size": 1400},
    {"symbol": "HEROMOTOCO", "name": "Hero MotoCorp Ltd", "type": "EQUITY", "sector": "Automobile", "lot_size": 150},
    {"symbol": "BPCL", "name": "Bharat Petroleum Corporation Ltd", "type": "EQUITY", "sector": "Energy", "lot_size": 1800},
    {"symbol": "SHRIRAMFIN", "name": "Shriram Finance Ltd", "type": "EQUITY", "sector": "Financial", "lot_size": 300},
    {"symbol": "TRENT", "name": "Trent Ltd", "type": "EQUITY", "sector": "Retail", "lot_size": 100},
    {"symbol": "BEL", "name": "Bharat Electronics Ltd", "type": "EQUITY", "sector": "Defense", "lot_size": 5700},

    # Next 50 & High Beta / High Volume Equities
    {"symbol": "ZOMATO", "name": "Zomato Ltd", "type": "EQUITY", "sector": "Internet", "lot_size": 2000},
    {"symbol": "JIOFIN", "name": "Jio Financial Services Ltd", "type": "EQUITY", "sector": "Financial", "lot_size": 2000},
    {"symbol": "HAL", "name": "Hindustan Aeronautics Ltd", "type": "EQUITY", "sector": "Defense", "lot_size": 300},
    {"symbol": "TATAPOWER", "name": "Tata Power Company Ltd", "type": "EQUITY", "sector": "Power", "lot_size": 3375},
    {"symbol": "VEDL", "name": "Vedanta Ltd", "type": "EQUITY", "sector": "Metals", "lot_size": 2300},
    {"symbol": "IRFC", "name": "Indian Railway Finance Corporation", "type": "EQUITY", "sector": "Railways", "lot_size": 3000},
    {"symbol": "RVNL", "name": "Rail Vikas Nigam Ltd", "type": "EQUITY", "sector": "Railways", "lot_size": 1500},
    {"symbol": "IREDA", "name": "Indian Renewable Energy Dev Agency", "type": "EQUITY", "sector": "Green Energy", "lot_size": 2500},
    {"symbol": "SUZLON", "name": "Suzlon Energy Ltd", "type": "EQUITY", "sector": "Green Energy", "lot_size": 5000},
    {"symbol": "BSE", "name": "BSE Ltd (Exchange)", "type": "EQUITY", "sector": "Financial", "lot_size": 500},
    {"symbol": "CDSL", "name": "Central Depository Services Ltd", "type": "EQUITY", "sector": "Financial", "lot_size": 300},
    {"symbol": "POLYCAB", "name": "Polycab India Ltd", "type": "EQUITY", "sector": "Capital Goods", "lot_size": 125},
    {"symbol": "PERSISTENT", "name": "Persistent Systems Ltd", "type": "EQUITY", "sector": "IT", "lot_size": 100},
    {"symbol": "COFORGE", "name": "Coforge Ltd", "type": "EQUITY", "sector": "IT", "lot_size": 150},
    {"symbol": "LTIM", "name": "LTIMindtree Ltd", "type": "EQUITY", "sector": "IT", "lot_size": 150},
    {"symbol": "DLF", "name": "DLF Ltd", "type": "EQUITY", "sector": "Realty", "lot_size": 1650},
    {"symbol": "GODREJPROP", "name": "Godrej Properties Ltd", "type": "EQUITY", "sector": "Realty", "lot_size": 300},
    {"symbol": "LICI", "name": "Life Insurance Corporation of India", "type": "EQUITY", "sector": "Insurance", "lot_size": 750},
    {"symbol": "INDUSINDBK", "name": "IndusInd Bank Ltd", "type": "EQUITY", "sector": "Banking", "lot_size": 500},
    {"symbol": "BANKBARODA", "name": "Bank of Baroda", "type": "EQUITY", "sector": "Banking", "lot_size": 2925},
    {"symbol": "PNB", "name": "Punjab National Bank", "type": "EQUITY", "sector": "Banking", "lot_size": 8000},
    {"symbol": "CANBK", "name": "Canara Bank", "type": "EQUITY", "sector": "Banking", "lot_size": 4500},
    {"symbol": "IDFCFIRSTB", "name": "IDFC First Bank Ltd", "type": "EQUITY", "sector": "Banking", "lot_size": 7500},
    {"symbol": "FEDERALBNK", "name": "The Federal Bank Ltd", "type": "EQUITY", "sector": "Banking", "lot_size": 5000},
    {"symbol": "CHOLAFIN", "name": "Cholamandalam Investment & Finance", "type": "EQUITY", "sector": "Financial", "lot_size": 625},
    {"symbol": "MUTHOOTFIN", "name": "Muthoot Finance Ltd", "type": "EQUITY", "sector": "Financial", "lot_size": 550},
    {"symbol": "PIDILITIND", "name": "Pidilite Industries Ltd", "type": "EQUITY", "sector": "Chemicals", "lot_size": 250},
    {"symbol": "SRF", "name": "SRF Ltd", "type": "EQUITY", "sector": "Chemicals", "lot_size": 375},
    {"symbol": "TATACHEM", "name": "Tata Chemicals Ltd", "type": "EQUITY", "sector": "Chemicals", "lot_size": 550},
    {"symbol": "DEEPAKNTR", "name": "Deepak Nitrite Ltd", "type": "EQUITY", "sector": "Chemicals", "lot_size": 300},
    {"symbol": "HAVELLS", "name": "Havells India Ltd", "type": "EQUITY", "sector": "Consumer", "lot_size": 500},
    {"symbol": "VOLTAS", "name": "Voltas Ltd", "type": "EQUITY", "sector": "Consumer", "lot_size": 600},
    {"symbol": "DIXON", "name": "Dixon Technologies Ltd", "type": "EQUITY", "sector": "Electronics", "lot_size": 100},
    {"symbol": "KALYANKJIL", "name": "Kalyan Jewellers India Ltd", "type": "EQUITY", "sector": "Consumer", "lot_size": 1000},
    {"symbol": "BHEL", "name": "Bharat Heavy Electricals Ltd", "type": "EQUITY", "sector": "Capital Goods", "lot_size": 5250},
    {"symbol": "MAZDOCK", "name": "Mazagon Dock Shipbuilders Ltd", "type": "EQUITY", "sector": "Defense", "lot_size": 200},
    {"symbol": "COCHINSHIP", "name": "Cochin Shipyard Ltd", "type": "EQUITY", "sector": "Defense", "lot_size": 300},
    {"symbol": "PAYTM", "name": "One97 Communications Ltd (Paytm)", "type": "EQUITY", "sector": "Fintech", "lot_size": 1000},
    {"symbol": "NYKAA", "name": "FSN E-Commerce Ventures Ltd (Nykaa)", "type": "EQUITY", "sector": "Internet", "lot_size": 2500},
    {"symbol": "POLICYBZR", "name": "PB Fintech Ltd (PolicyBazaar)", "type": "EQUITY", "sector": "Fintech", "lot_size": 500},
    {"symbol": "MOTHERSON", "name": "Samvardhana Motherson International", "type": "EQUITY", "sector": "Automobile", "lot_size": 7100},
    {"symbol": "TVSMOTOR", "name": "TVS Motor Company Ltd", "type": "EQUITY", "sector": "Automobile", "lot_size": 350},
    {"symbol": "BALKRISIND", "name": "Balkrishna Industries Ltd", "type": "EQUITY", "sector": "Automobile", "lot_size": 300},
    {"symbol": "MRF", "name": "MRF Ltd", "type": "EQUITY", "sector": "Automobile", "lot_size": 5},
    {"symbol": "AUROPHARMA", "name": "Aurobindo Pharma Ltd", "type": "EQUITY", "sector": "Pharma", "lot_size": 550},
    {"symbol": "LUPIN", "name": "Lupin Ltd", "type": "EQUITY", "sector": "Pharma", "lot_size": 425},
    {"symbol": "TORNTPHARM", "name": "Torrent Pharmaceuticals Ltd", "type": "EQUITY", "sector": "Pharma", "lot_size": 250},
    {"symbol": "MANAPPURAM", "name": "Manappuram Finance Ltd", "type": "EQUITY", "sector": "Financial", "lot_size": 3000},
    {"symbol": "ABCAPITAL", "name": "Aditya Birla Capital Ltd", "type": "EQUITY", "sector": "Financial", "lot_size": 5400},
    {"symbol": "MFSL", "name": "Max Financial Services Ltd", "type": "EQUITY", "sector": "Insurance", "lot_size": 800},
    {"symbol": "SBILIFE", "name": "SBI Life Insurance Company Ltd", "type": "EQUITY", "sector": "Insurance", "lot_size": 750},
    {"symbol": "HDFCLIFE", "name": "HDFC Life Insurance Company Ltd", "type": "EQUITY", "sector": "Insurance", "lot_size": 1100},
    {"symbol": "ICICIPRULI", "name": "ICICI Prudential Life Insurance", "type": "EQUITY", "sector": "Insurance", "lot_size": 1500},
    {"symbol": "ICICIGI", "name": "ICICI Lombard General Insurance", "type": "EQUITY", "sector": "Insurance", "lot_size": 500},
]

# Quick symbol index for O(1) resolution
NSE_SYMBOL_INDEX = {item["symbol"].upper(): item for item in NSE_UNIVERSE}

def search_nse_instruments(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    """
    Fast fuzzy search across NSE ticker symbols and company names.
    If the exact query is not in the predefined index, it still returns a valid
    dynamic NSE entry so ANY NSE stock (all 2,000+ listed) can be loaded!
    """
    q = query.upper().strip()
    if not q:
        return NSE_UNIVERSE[:limit]

    matches = []
    # 1. Exact or prefix symbol match
    for item in NSE_UNIVERSE:
        if item["symbol"].startswith(q):
            matches.append(item)

    # 2. Substring match in symbol or company name
    for item in NSE_UNIVERSE:
        if item not in matches and (q in item["symbol"] or q in item["name"].upper()):
            matches.append(item)

    # 3. If no match or user typed a custom ticker, synthesize dynamic entry
    if not matches or (q not in [m["symbol"] for m in matches]):
        clean_q = q.replace(".NS", "").replace("^", "")
        if len(clean_q) >= 2:
            matches.insert(0, {
                "symbol": clean_q,
                "name": f"{clean_q} (NSE Listed Stock)",
                "type": "EQUITY",
                "sector": "NSE Equities",
                "lot_size": 1
            })

    return matches[:limit]

def get_instrument_lot_size(symbol: str) -> int:
    """Returns official lot size for F&O contracts or sensible standard defaults."""
    clean = symbol.upper().replace(".NS", "").replace("^", "").strip()
    if clean in NSE_SYMBOL_INDEX:
        return NSE_SYMBOL_INDEX[clean].get("lot_size", 250)
    
    # Common index defaults
    if "BANKNIFTY" in clean:
        return 15
    if "NIFTY" in clean:
        return 25
    if "FINNIFTY" in clean:
        return 40
    if "MIDCPNIFTY" in clean:
        return 75
    
    # Generic F&O equity default
    return 250

