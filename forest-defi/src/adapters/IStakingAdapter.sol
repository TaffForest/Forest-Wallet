// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IStakingAdapter {
    function stake(uint256 amount) external returns (uint256 shares);
    function unstake(uint256 shares) external returns (uint256 amount);
    function harvest() external returns (uint256 rewards);
    function getTotalStaked() external view returns (uint256);
    function getRewards() external view returns (uint256);
    function getShares(address user) external view returns (uint256);
    function getStakedAmount(address user) external view returns (uint256);
}
