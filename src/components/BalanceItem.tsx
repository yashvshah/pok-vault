import React from 'react';

interface BalanceItemProps {
  title: string;
  balance: React.ReactNode;
  action?: React.ReactNode;
}

export default function BalanceItem({ title, balance, action }: BalanceItemProps) {
  return (
    <div className="rounded-lg bg-white/5 p-2.5 sm:p-3">
      <div className="font-medium text-sm sm:text-base">{title}</div>
      <div className="mt-1 text-xs sm:text-sm">Balance: {balance}</div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
