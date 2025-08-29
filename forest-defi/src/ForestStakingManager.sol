// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./fMON.sol";
import "./adapters/IStakingAdapter.sol";

contract ForestStakingManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    fMON public immutable fMONToken;
    IERC20 public immutable monToken;
    
    mapping(address => uint256) public userStaked;
    mapping(address => uint256) public userfMON;
    mapping(address => uint256) public userLastHarvest;
    uint256 public totalStaked;
    uint256 public totalfMONMinted;
    
    // Adapter management
    address public defaultAdapter;
    mapping(address => bool) public approvedAdapters;
    
    uint256 public constant REWARD_RATE = 1000; // 10% APY (1000 basis points)
    uint256 public constant HARVEST_COOLDOWN = 1 days;
    
    event Staked(address indexed user, uint256 amount, uint256 fMONMinted);
    event Unstaked(address indexed user, uint256 amount, uint256 fMONBurned);
    event Harvested(address indexed user, uint256 rewards);
    event AdapterStaked(address indexed user, uint256 amount, address adapter);
    event AdapterUnstaked(address indexed user, uint256 amount, address adapter);
    event AdapterSet(address indexed adapter, bool approved);
    event DefaultAdapterSet(address indexed adapter);
    
    constructor(address _monToken) Ownable(msg.sender) {
        monToken = IERC20(_monToken);
        fMONToken = new fMON();
    }
    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        monToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 fMONAmount = calculatefMONAmount(amount);
        fMONToken.mint(msg.sender, fMONAmount);
        
        userStaked[msg.sender] += amount;
        userfMON[msg.sender] += fMONAmount;
        totalStaked += amount;
        totalfMONMinted += fMONAmount;
        
        emit Staked(msg.sender, amount, fMONAmount);
    }
    
    function unstake(uint256 fMONAmount) external nonReentrant {
        require(fMONAmount > 0, "fMON amount must be greater than 0");
        require(userfMON[msg.sender] >= fMONAmount, "Insufficient fMON");
        
        uint256 monAmount = calculateMONAmount(fMONAmount);
        require(userStaked[msg.sender] >= monAmount, "Insufficient staked amount");
        
        fMONToken.burn(fMONAmount);
        monToken.safeTransfer(msg.sender, monAmount);
        
        userStaked[msg.sender] -= monAmount;
        userfMON[msg.sender] -= fMONAmount;
        totalStaked -= monAmount;
        totalfMONMinted -= fMONAmount;
        
        emit Unstaked(msg.sender, monAmount, fMONAmount);
    }
    
    function harvest() external nonReentrant {
        uint256 rewards = getPendingRewards(msg.sender);
        require(rewards > 0, "No rewards to harvest");
        require(block.timestamp >= userLastHarvest[msg.sender] + HARVEST_COOLDOWN, "Harvest cooldown not met");
        
        fMONToken.mint(msg.sender, rewards);
        userLastHarvest[msg.sender] = block.timestamp;
        
        emit Harvested(msg.sender, rewards);
    }
    
    function stakeToAdapter(uint256 fMONAmount, address adapter) external nonReentrant {
        require(fMONAmount > 0, "fMON amount must be greater than 0");
        require(userfMON[msg.sender] >= fMONAmount, "Insufficient fMON");
        require(adapter != address(0), "Invalid adapter address");
        
        fMONToken.transferFrom(msg.sender, adapter, fMONAmount);
        
        uint256 shares = IStakingAdapter(adapter).stake(fMONAmount);
        
        emit AdapterStaked(msg.sender, fMONAmount, adapter);
    }
    
    function unstakeFromAdapter(uint256 shares, address adapter) external nonReentrant {
        require(shares > 0, "Shares must be greater than 0");
        require(adapter != address(0), "Invalid adapter address");
        
        uint256 fMONAmount = IStakingAdapter(adapter).unstake(shares);
        fMONToken.transfer(msg.sender, fMONAmount);
        
        emit AdapterUnstaked(msg.sender, fMONAmount, adapter);
    }
    
    function calculatefMONAmount(uint256 monAmount) public view returns (uint256) {
        if (totalStaked == 0) {
            return monAmount;
        }
        return (monAmount * totalfMONMinted) / totalStaked;
    }
    
    function calculateMONAmount(uint256 fMONAmount) public view returns (uint256) {
        if (totalfMONMinted == 0) {
            return fMONAmount;
        }
        return (fMONAmount * totalStaked) / totalfMONMinted;
    }
    
    function getPendingRewards(address user) public view returns (uint256) {
        if (userStaked[user] == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - userLastHarvest[user];
        return (userStaked[user] * REWARD_RATE * timeElapsed) / (365 days * 10000);
    }
    
    function getUserInfo(address user) external view returns (
        uint256 staked,
        uint256 fMON,
        uint256 pendingRewards,
        uint256 lastHarvest
    ) {
        return (
            userStaked[user],
            userfMON[user],
            getPendingRewards(user),
            userLastHarvest[user]
        );
    }
    
    // Adapter management functions
    function setAdapter(address adapter, bool approved) external onlyOwner {
        require(adapter != address(0), "Invalid adapter address");
        approvedAdapters[adapter] = approved;
        emit AdapterSet(adapter, approved);
    }
    
    function setDefaultAdapter(address adapter) external onlyOwner {
        require(adapter != address(0), "Invalid adapter address");
        require(approvedAdapters[adapter], "Adapter not approved");
        defaultAdapter = adapter;
        emit DefaultAdapterSet(adapter);
    }
    
    function stakeToDefaultAdapter(uint256 fMONAmount) external nonReentrant {
        require(defaultAdapter != address(0), "No default adapter set");
        require(fMONAmount > 0, "fMON amount must be greater than 0");
        require(userfMON[msg.sender] >= fMONAmount, "Insufficient fMON");
        
        fMONToken.transferFrom(msg.sender, defaultAdapter, fMONAmount);
        
        uint256 shares = IStakingAdapter(defaultAdapter).stake(fMONAmount);
        
        emit AdapterStaked(msg.sender, fMONAmount, defaultAdapter);
    }
}
