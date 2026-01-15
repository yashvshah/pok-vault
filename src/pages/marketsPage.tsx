import { useState, type FunctionComponent } from "react";
import MarketCard from "../components/MarketCard";
import MarketActionCard from "../components/MarketActionCard";
import MarketFilters from "../components/MarketFilters";

interface MarketsPageProps {}

const MarketsPage: FunctionComponent<MarketsPageProps> = () => {
  const [amount, setAmount] = useState("0.00");

  return (
    <>
      <div className="mx-30 mb-10">
        <h1 className="text-5xl font-League-Spartan mt-10 ">MARKETS</h1>
        <p className="text-gray-400 mt-5 max-w-lg">
          Deploy capital into automated strategies that exploit prediction
          market inefficiencies and generate yield.
        </p>

        <MarketFilters
          availableMarkets={["Polymarket", "Opinion", "Manifold"]}
          onChange={() =>{}}
        />

        <div className="grid grid-cols-2 gap-5 items-start">
          <MarketCard
            image="🗳️"
            question="Will Donald Trump Win the 2024 Election?"
            status="Allowed"
            markets={[
              {
                name: "Polymarket",
                question: "Will Donald Trump Win the 2024 Election?",
              },
              { name: "Opinion", question: "Who Will Win: Donald Trump" },
            ]}
            balances={<></>}
            actionTabs={[
              {
                key: "merge",
                label: "Merge & Exit",
                content: (
                  <MarketActionCard
                    title="NO Poly + YES Opinion (Bridged)"
                    inputLabel="Amount to Merge"
                    inputValue={amount}
                    maxValue="75.25"
                    receiveItems={[
                      {
                        amount: "983.92",
                        token: "YES Poly",
                        highlight: "yellow",
                      },
                      {
                        amount: "983.92",
                        token: "NO Opinion",
                        highlight: "yellow",
                      },
                    ]}
                    buttonLabel="Merge & Exit"
                    onInputChange={setAmount}
                    onSubmit={() => {
                      console.log("Merge submitted:", amount);
                    }}
                  />
                ),
              },
              {
                key: "split",
                label: "Split & Acquire",
                content: (
                  <MarketActionCard
                    title="NO Poly + YES Opinion (Bridged)"
                    inputLabel="Amount to Merge"
                    inputValue={amount}
                    maxValue="75.25"
                    receiveItems={[
                      {
                        amount: "983.92",
                        token: "YES Poly",
                        highlight: "yellow",
                      },
                      {
                        amount: "983.92",
                        token: "NO Opinion",
                        highlight: "yellow",
                      },
                    ]}
                    buttonLabel="Merge & Exit"
                    onInputChange={setAmount}
                    onSubmit={() => {
                      console.log("Merge submitted:", amount);
                    }}
                  />
                ),
              },
            ]}
          />
          <MarketCard
            image="🗳️"
            question="Will Donald Trump Win the 2024 Election?"
            status="Allowed"
            markets={[
              {
                name: "Polymarket",
                question: "Will Donald Trump Win the 2024 Election?",
              },
              { name: "Opinion", question: "Who Will Win: Donald Trump" },
            ]}
            balances={<></>}
            actionTabs={[
              {
                key: "merge",
                label: "Merge & Exit",
                content: (
                  <MarketActionCard
                    title="NO Poly + YES Opinion (Bridged)"
                    inputLabel="Amount to Merge"
                    inputValue={amount}
                    maxValue="75.25"
                    receiveItems={[
                      {
                        amount: "983.92",
                        token: "YES Poly",
                        highlight: "yellow",
                      },
                      {
                        amount: "983.92",
                        token: "NO Opinion",
                        highlight: "yellow",
                      },
                    ]}
                    buttonLabel="Merge & Exit"
                    onInputChange={setAmount}
                    onSubmit={() => {
                      console.log("Merge submitted:", amount);
                    }}
                  />
                ),
              },
              {
                key: "split",
                label: "Split & Acquire",
                content: (
                  <MarketActionCard
                    title="NO Poly + YES Opinion (Bridged)"
                    inputLabel="Amount to Merge"
                    inputValue={amount}
                    maxValue="75.25"
                    receiveItems={[
                      {
                        amount: "983.92",
                        token: "YES Poly",
                        highlight: "yellow",
                      },
                      {
                        amount: "983.92",
                        token: "NO Opinion",
                        highlight: "yellow",
                      },
                    ]}
                    buttonLabel="Merge & Exit"
                    onInputChange={setAmount}
                    onSubmit={() => {
                      console.log("Merge submitted:", amount);
                    }}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
};

export default MarketsPage;
