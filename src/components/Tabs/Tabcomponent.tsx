import React from "react";

interface TabProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  activeClassName?: string;
  inActiveClassName?: string;
  xClassName?:string;
}

const TabComponent: React.FC<TabProps> = ({
  label,
  isActive,
  onClick,
  activeClassName,
  inActiveClassName,
  icon,
  xClassName
}) => {
  return (
    <div
      onClick={onClick}
      className={`px-3 sm:px-4 py-2 cursor-pointer flex justify-center items-center gap-2 text-sm sm:text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
        isActive
          ? activeClassName ?? "border-b-4 border-primary text-white"
          : inActiveClassName ?? "text-gray-400"
      } ${xClassName}`}
    >
      {icon}
      {label}
    </div>
  );
};

export default TabComponent;
