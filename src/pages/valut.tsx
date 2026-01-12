import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import Tabs from "../components/Tabs/TabsComponent";
import { FaPercent, FaRegArrowAltCircleDown } from "react-icons/fa";
import { GrMoney } from "react-icons/gr";

const VaultPage = () => {
  const points = [
    "Automated strategies rebalance capital across markets in real time.",
    "Funds remain non-custodial and fully transparent on-chain.",
    "Smart contracts optimize execution to minimize slippage.",
    "Yields are generated from market inefficiencies, not speculation.",
    "Withdraw liquidity at any time with no lock-up period.",
  ];

  const shorten = (val: string, start = 6, end = 4) =>
    `${val.slice(0, start)}...${val.slice(-end)}`;

  const data = [
    {
      type: "Withdrawal",
      market: "N/A",
      amount: "9 USDC",
      user: "0x8a7f538b6f6bdab69edd0e311aeda9214bc5384a",
      tx: "0x2dbf8b52d3b3ab370e96f14083116259868b5c9c9ad4946fd477e9aa2ea067b",
      time: "11/01/2026 11:40:52",
    },
    {
      type: "New Outcome Pair",
      market: "Will NVIDIA be the largest company by market cap on Jan 31?",
      amount: "—",
      user: "—",
      tx: "0xbc5d10fc203c77b0864e6e363fadbdd42fb2b32624d0a8156d190bf27893c965",
      time: "11/01/2026 00:06:18",
    },
    {
      type: "Withdrawal",
      market: "N/A",
      amount: "9 USDC",
      user: "0x8a7f538b6f6bdab69edd0e311aeda9214bc5384a",
      tx: "0x2dbf8b52d3b3ab370e96f14083116259868b5c9c9ad4946fd477e9aa2ea067b",
      time: "11/01/2026 11:40:52",
    },
    {
      type: "New Outcome Pair",
      market: "Will NVIDIA be the largest company by market cap on Jan 31?",
      amount: "—",
      user: "—",
      tx: "0xbc5d10fc203c77b0864e6e363fadbdd42fb2b32624d0a8156d190bf27893c965",
      time: "11/01/2026 00:06:18",
    },
  ];
  return (
    <main className="px-24 mt-14">
      <div className="flex justify-around items-center gap-10">
        {/* LEFT SECTION */}
        <div>
          <h1 className="text-7xl text-white leading-tight font-League-Spartan">
            Earn Passive Income From
            <br />
            Prediction Market Arbitrage
          </h1>

          <p className="text-gray-400 mt-5 max-w-lg">
            Deploy capital into automated strategies that exploit prediction
            market inefficiencies and generate yield.
          </p>

          <div className="flex justify-between items-center w-fit border border-primary/40 rounded-xl p-4 mt-10">
            <div className="px-6 flex items-center gap-4">
              <div className="border border-primary/70 bg-[#1c0e0e] p-2 rounded-md">
                <GrMoney />
              </div>
              <div>
                <p className="text-secondry">Total Assets</p>
                <p className="text-xl">0.9840%</p>
              </div>
            </div>
            <div className="px-6 border-l border-primary/50 flex items-center gap-4">
              <div className="border border-primary/70 bg-[#1c0e0e] p-2 rounded-md">
                <FaPercent />
              </div>
              <div>
                <p className="text-secondry">APY</p>
                <p className="text-xl">0.9840%</p>
              </div>
            </div>
            <div className="px-6 border-l border-primary/50 flex items-center gap-4">
              <div className="border border-primary/70 bg-[#1c0e0e] p-2 rounded-md">
                <GrMoney />
              </div>
              <div>
                <p className="text-secondry">Net Value</p>
                <p className="text-xl">0.9840%</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="reletive">
          <div className="absolute right-36 top-34 gradiant-border rounded-xl -z-10 blur-xs">
            <div className="box-of-gradiant-border rounded-xl w-95 h-95 backdrop-blur-xs"></div>
          </div>
          <div className="gradiant-border rounded-xl z-10">
            <div className="box-of-gradiant-border rounded-xl p-6 w-95">
              <Tabs
                tabs={[{ label: "Deposit" }, { label: "Withdraw" }]}
                xClassName="w-full"
              >
                {/* DEPOSIT */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span>
                      <label className="font-extralight text-xs text-secondry">
                        From Wallet
                      </label>
                      <div className="gradiant-border">
                        <input
                          placeholder="0"
                          className="w-full box-of-gradiant-border focus:outline-none"
                        />
                      </div>
                    </span>
                    <span>
                      <label className="font-extralight text-xs text-secondry">
                        Amount
                      </label>
                      <div className="gradiant-border">
                        <input
                          placeholder="0"
                          className="w-full box-of-gradiant-border focus:outline-none"
                        />
                      </div>
                    </span>
                  </div>
                  <span className="flex items-center justify-center text-primary/60">
                    <FaRegArrowAltCircleDown size={25} />
                  </span>
                  <div className="flex gap-3">
                    <span>
                      <label className="font-extralight text-xs text-secondry">
                        To valut
                      </label>
                      <div className="gradiant-border">
                        <input
                          placeholder="0x"
                          className="w-full box-of-gradiant-border focus:outline-none"
                        />
                      </div>
                    </span>
                    <span>
                      <label className="font-extralight text-xs text-secondry">
                        You will recive
                      </label>
                      <div className="gradiant-border">
                        <input
                          placeholder="0"
                          className="w-full box-of-gradiant-border focus:outline-none"
                        />
                      </div>
                    </span>
                  </div>
                  <button className="w-full bg-primary py-3 rounded-lg font-semibold">
                    Deposit
                  </button>
                </div>

                {/* WITHDRAW */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span>
                      <label className="font-extralight text-xs text-secondry">
                        From Wallet
                      </label>
                      <div className="gradiant-border">
                        <input
                          placeholder="0"
                          className="w-full box-of-gradiant-border focus:outline-none"
                        />
                      </div>
                    </span>
                    <span>
                      <label className="font-extralight text-xs text-secondry">
                        Amount
                      </label>
                      <div className="gradiant-border">
                        <input
                          placeholder="0"
                          className="w-full box-of-gradiant-border focus:outline-none"
                        />
                      </div>
                    </span>
                  </div>
                  <span className="flex items-center justify-center text-primary/60">
                    <FaRegArrowAltCircleDown size={25} />
                  </span>
                  <div className="flex gap-3">
                    <span>
                      <label className="font-extralight text-xs text-secondry">
                        To valut
                      </label>
                      <div className="gradiant-border">
                        <input
                          placeholder="0x"
                          className="w-full box-of-gradiant-border focus:outline-none"
                        />
                      </div>
                    </span>
                    <span>
                      <label className="font-extralight text-xs text-secondry">
                        You will recive
                      </label>
                      <div className="gradiant-border">
                        <input
                          placeholder="0"
                          className="w-full box-of-gradiant-border focus:outline-none"
                        />
                      </div>
                    </span>
                  </div>
                  <button className="w-full bg-primary py-3 rounded-lg font-semibold">
                    Deposit
                  </button>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-linear-to-b from-primary to-[#863A3C] p-px rounded-xl my-18 mx-10">
        <div className="box-of-gradiant-border rounded-xl bg-[#0f0f0f] p-5">
          <Tabs tabs={[{ label: "INFO" }, { label: "ACTIVITY" }]}>
            <div>
              <ul className="space-y-3 ml-5">
                {points.map((text, index) => (
                  <li key={index} className="flex items-start gap-5">
                    <span>
                      <MdKeyboardDoubleArrowRight
                        className="text-primary mt-1"
                        size={20}
                      />
                    </span>
                    <p className="text-gray-300 leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
            </div>
            {/* table */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Market</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Tx Hash</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="px-4 py-3">{row.type}</td>

                      <td className="px-4 py-3 max-w-[320px] truncate">
                        {row.market}
                      </td>

                      <td className="px-4 py-3">{row.amount}</td>

                      <td
                        className="px-4 py-3 font-mono text-primary"
                        title={row.user}
                      >
                        {row.user !== "—" ? shorten(row.user) : "—"}
                      </td>

                      <td
                        className="px-4 py-3 font-mono text-primary"
                        title={row.tx}
                      >
                        {shorten(row.tx)}
                      </td>

                      <td className="px-4 py-3 text-gray-400">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default VaultPage;
