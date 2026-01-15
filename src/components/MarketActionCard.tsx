import React from "react";

interface ReceiveItem {
  amount: string;
  token: string;
  highlight?: "green" | "yellow";
}

interface MarketActionCardProps {
  title: string;
  inputLabel: string;
  inputValue: string;
  maxValue?: string;
  receiveItems: ReceiveItem[];
  buttonLabel: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}

const MarketActionCard: React.FC<MarketActionCardProps> = ({
  title,
  inputLabel,
  inputValue,
  maxValue,
  receiveItems,
  buttonLabel,
  onInputChange,
  onSubmit,
}) => {
  return (
    <div className="w-full rounded-2xl bg-secondry/5 p-6">
      {/* Title */}
      <h3 className="text-lg font-medium text-primary mb-4">{title}</h3>

      {/* Input Label */}
      <label className="block text-sm text-gray-400 mb-2">{inputLabel}</label>

      {/* Input */}
      <div className="gradiant-border">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="0.00"
          className="
          w-full rounded-lg
         box-of-gradiant-border
          px-4 py-3
          text-lg text-gray-200
          placeholder-gray-500
          focus:outline-none

        "
        />
      </div>
      {/* Max */}
      {maxValue && (
        <p className="mt-2 text-xs text-gray-500">Max: {maxValue}</p>
      )}

      {/* Receive Box */}
      <div className="gradiant-border mt-4">
        <div className="rounded-lg box-of-gradiant-border p-4">
          <p className="text-sm text-gray-400 mb-1">You'll Receive</p>
          <div className="space-y-1">
            {receiveItems.map((item, idx) => (
              <p
                key={idx}
                className={`text-lg tracking-wide ${
                  item.highlight === "green"
                    ? "text-green-400"
                    : "text-[#FDAF42]"
                }`}
              >
                {item.amount} {item.token}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={onSubmit}
        className="
          mt-6 w-full rounded-xl
          bg-primary
          py-3 text-lg font-medium text-white"
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default MarketActionCard;
