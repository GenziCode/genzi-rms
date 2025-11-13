import { useState } from 'react';
import { X, Delete } from 'lucide-react';

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(current);
    } else if (operation) {
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }
    
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      case '%': return a * (b / 100);
      default: return b;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

  const buttons = [
    ['C', 'CE', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', '←'],
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Calculator</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Display */}
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            {operation && previousValue !== null && (
              <p className="text-blue-100 text-sm mb-1">
                {previousValue} {operation}
              </p>
            )}
            <p className="text-3xl font-bold text-right font-mono">{display}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {buttons.flat().map((btn, index) => {
              const isOperation = ['/', '*', '-', '+', '='].includes(btn);
              const isSpecial = ['C', 'CE', '%', '←'].includes(btn);
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (btn === 'C') handleClear();
                    else if (btn === 'CE') handleClear();
                    else if (btn === '←') handleBackspace();
                    else if (btn === '=') handleEquals();
                    else if (btn === '.') handleDecimal();
                    else if (isOperation) handleOperation(btn);
                    else handleNumber(btn);
                  }}
                  className={`
                    h-14 rounded-lg font-semibold text-lg transition-all transform active:scale-95
                    ${isOperation 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-md' 
                      : isSpecial
                      ? 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }
                    ${btn === '0' ? 'col-span-2' : ''}
                  `}
                >
                  {btn === '←' ? <Delete className="w-5 h-5 mx-auto" /> : btn}
                </button>
              );
            })}
          </div>

          {/* Quick Operations */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                const value = parseFloat(display);
                setDisplay(String(value * 0.9)); // 10% off
                setNewNumber(true);
              }}
              className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
            >
              -10%
            </button>
            <button
              onClick={() => {
                const value = parseFloat(display);
                setDisplay(String(value * 0.8)); // 20% off
                setNewNumber(true);
              }}
              className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
            >
              -20%
            </button>
            <button
              onClick={() => {
                const value = parseFloat(display);
                setDisplay(String(value * 1.13)); // +13% tax
                setNewNumber(true);
              }}
              className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              +13% Tax
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

