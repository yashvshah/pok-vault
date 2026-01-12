import React, { useEffect, useState } from "react";
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

  useEffect(() => setActive(initialIndex), [initialIndex]);

  return (
    <>
      <div className="flex border-b border-primary/20">
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

      <div className="mt-4">{children[active]}</div>
    </>
  );
};

export default TabsComponent;
