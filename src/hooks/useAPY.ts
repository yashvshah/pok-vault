import { useDeposits } from './activities/useDeposits';


// we get the last 100 deposits and calculate the APY based on that
// based on the time difference between the first and last deposit and the share price difference
export function useAPY() {
    const limit = 100;
    const { data: deposits } = useDeposits(limit);
    
    if (!deposits || deposits.length < 2) {
        return 0;
    }

    const firstDeposit = deposits[deposits.length - 1];
    const lastDeposit = deposits[0];

    const timeDiff = Number(lastDeposit.timestamp_) - Number(firstDeposit.timestamp_);
    const yearsDiff = timeDiff / (365 * 24 * 60 * 60);

    const firstSharePrice = Number(firstDeposit.assets) / Number(firstDeposit.shares);
    const lastSharePrice = Number(lastDeposit.assets) / Number(lastDeposit.shares);

    const totalReturn = (lastSharePrice - firstSharePrice) / firstSharePrice;

    const apy = (totalReturn / yearsDiff) * 100;

    return apy;
}