export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface Analysis {
  marketType?: string;
  trend?: string;
  structure?: string;
  candleBehavior?: string;
  direction?: 'BUY' | 'SELL' | 'WAIT';
  explanation?: string;
  riskNote?: string;
  rawText?: string;
}
