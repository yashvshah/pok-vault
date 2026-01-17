import React, { useState } from "react";
import Tab from "./Tabcomponent";

interface TabsProps {
  tabs: { label: string; icon?: React.ReactNode }[];
  children: React.ReactNode[];
  initialIndex?: number;
  xClassName?:string;
}

const TabsComponent: React.FC<TabsProps> = ({
  tabs,
  children,
  initialIndex = 0,
  xClassName,
}) => {
  const [active, setActive] = useState(initialIndex);

  return (
    <>
      <div className="flex flex-wrap border-b border-primary/20 overflow-x-auto">
        {tabs.map((tab, i) => (
          <Tab
            key={i}
            label={tab.label}
            icon={tab.icon}
            isActive={i === active}
            onClick={() => setActive(i)}
            xClassName={xClassName}
          />
        ))}
      </div>

      <div className="mt-3 sm:mt-4">{children[active]}</div>
    </>
  );
};

export default TabsComponent;
