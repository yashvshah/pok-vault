import React from "react";

interface ReceiveItem {
  amount: string;
  token: string;
  highlight?: "green" | "yellow" | "primary";
}

interface MarketActionCardProps {
  title: string;
  inputLabel: string;
  inputValue: string;
  maxValue?: string;
  balanceInfo?: string; // Balance text to display
  onMaxClick?: () => void; // Max button handler
  receiveItems: ReceiveItem[];
  buttonLabel: string;
  isLoading?: boolean;
  disabled?: boolean; // controls input disabled
  buttonDisabled?: boolean; // controls button disabled
  disabledReason?: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}

const MarketActionCard: React.FC<MarketActionCardProps> = ({
  title,
  inputLabel,
  inputValue,
  maxValue,
  balanceInfo,
  onMaxClick,
  receiveItems,
  buttonLabel,
  disabled = false,
  buttonDisabled,
  disabledReason,
  onInputChange,
  onSubmit,
}) => {
  const getHighlightColor = (highlight?: string) => {
    switch (highlight) {
      case "green":
        return "text-green-400";
      case "yellow":
        return "text-[#FDAF42]";
      case "primary":
        return "text-primary";
      default:
        return "text-[#FDAF42]";
    }
  };

  return (
    <div className="w-full rounded-2xl bg-secondry/5 p-4 sm:p-5 md:p-6">
      {/* Title */}
      <h3 className="text-base sm:text-lg font-medium text-primary mb-3 sm:mb-4">{title}</h3>

      {disabled && disabledReason && (
        <div className="mb-3 sm:mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs sm:text-sm">
          ⚠️ {disabledReason}
        </div>
      )}

      {/* Input Label */}
      <label className="block text-xs sm:text-sm text-gray-400 mb-2">{inputLabel}</label>

      {/* Balance and Max Button */}
      {balanceInfo && (
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-gray-400 truncate mr-2">{balanceInfo}</p>
          {onMaxClick && (
            <button
              onClick={onMaxClick}
              disabled={disabled}
              className="text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex-shrink-0 touch-manipulation min-h-[48px] sm:min-h-0 flex items-center"
            >
              MAX
            </button>
          )}
        </div>
      )}

      {/* Input */}
      <div className="gradiant-border">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="0.00"
          disabled={disabled}
          className="
          w-full rounded-lg
         box-of-gradiant-border
          px-3 sm:px-4 py-2.5 sm:py-3
          text-base sm:text-lg text-gray-200
          placeholder-gray-500
          focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        />
      </div>
      {/* Max */}
      {maxValue && (
        <p className="mt-2 text-xs text-gray-500 truncate">Max: {maxValue}</p>
      )}

      {/* Receive Box */}
      <div className="gradiant-border mt-3 sm:mt-4">
        <div className="rounded-lg box-of-gradiant-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-400 mb-1">You'll Receive</p>
          <div className="space-y-1">
            {receiveItems.map((item, idx) => (
              <p
                key={idx}
                className={`text-base sm:text-lg tracking-wide break-words ${getHighlightColor(item.highlight)}`}
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
        disabled={buttonDisabled ?? disabled}
        className="
          mt-4 sm:mt-6 w-full rounded-xl
          bg-primary
          py-3 sm:py-3.5 text-base sm:text-lg font-medium text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-primary/90 transition-colors
          min-h-[48px] touch-manipulation"
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default MarketActionCard;
