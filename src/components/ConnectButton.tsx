import { ConnectButton } from "@rainbow-me/rainbowkit";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ConnectWalletsProps {}

const ConnectWallets: React.FC<ConnectWalletsProps> = () => {
  return (
    <>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === "authenticated");

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="bg-primary px-6 sm:px-10 md:px-14 py-2 font-semibold rounded-xl text-sm sm:text-base whitespace-nowrap"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button onClick={openChainModal} type="button">
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center">
                    <button
                      onClick={openChainModal}
                      className="flex items-center px-3 py-1.5 bg-white/10 rounded-lg text-xs sm:text-sm hover:bg-white/20 transition-colors"
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            overflow: "hidden",
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </div>
                      )}
                      <span className="hidden sm:inline">{chain.name}</span>
                      <span className="sm:hidden">{chain.name?.substring(0, 3) ?? ''}</span>
                    </button>

                    <button 
                      onClick={openAccountModal} 
                      type="button"
                      className="px-3 py-1.5 bg-primary/20 rounded-lg text-xs sm:text-sm hover:bg-primary/30 transition-colors"
                    >
                      {account.displayName}
                      {account.displayBalance && (
                        <span className="hidden md:inline">
                          {` (${account.displayBalance})`}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </>
  );
};

export default ConnectWallets;
