// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IStakingAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AdapterMock is IStakingAdapter {
    IERC20 public token;
    mapping(address => uint256) public userShares;
    mapping(address => uint256) public userStaked;
    uint256 public totalStaked;
    uint256 public totalShares;
    uint256 public rewardRate = 1000; // 10% APY (1000 basis points)
    uint256 public lastRewardTime;
    
    constructor(address _token) {
        token = IERC20(_token);
        lastRewardTime = block.timestamp;
    }
    
    function stake(uint256 amount) external override returns (uint256 shares) {
        require(amount > 0, "Amount must be greater than 0");
        
        token.transferFrom(msg.sender, address(this), amount);
        
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalStaked;
        }
        
        userShares[msg.sender] += shares;
        userStaked[msg.sender] += amount;
        totalShares += shares;
        totalStaked += amount;
        
        return shares;
    }
    
    function unstake(uint256 shares) external override returns (uint256 amount) {
        require(shares > 0, "Shares must be greater than 0");
        require(userShares[msg.sender] >= shares, "Insufficient shares");
        
        amount = (shares * totalStaked) / totalShares;
        
        userShares[msg.sender] -= shares;
        userStaked[msg.sender] -= amount;
        totalShares -= shares;
        totalStaked -= amount;
        
        token.transfer(msg.sender, amount);
        
        return amount;
    }
    
    function harvest() external override returns (uint256 rewards) {
        rewards = getRewards();
        if (rewards > 0) {
            userStaked[msg.sender] += rewards;
            totalStaked += rewards;
            lastRewardTime = block.timestamp;
        }
        return rewards;
    }
    
    function getTotalStaked() external view override returns (uint256) {
        return totalStaked;
    }
    
    function getRewards() public view override returns (uint256) {
        if (userShares[msg.sender] == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - lastRewardTime;
        uint256 userStake = userStaked[msg.sender];
        return (userStake * rewardRate * timeElapsed) / (365 days * 10000);
    }
    
    function getShares(address user) external view override returns (uint256) {
        return userShares[user];
    }
    
    function getStakedAmount(address user) external view override returns (uint256) {
        return userStaked[user];
    }
}
