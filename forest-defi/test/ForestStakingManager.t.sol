// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/fMON.sol";
import "../src/ForestStakingManager.sol";
import "../src/adapters/AdapterMock.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ForestStakingManagerTest is Test {
    ForestStakingManager public stakingManager;
    fMON public fMONToken;
    AdapterMock public mockAdapter;
    
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public monToken = address(0x3); // Mock MON token
    
    uint256 public constant STAKE_AMOUNT = 1000e18;
    uint256 public constant REWARD_RATE = 1000; // 10% APY
    
    function setUp() public {
        // Deploy contracts
        stakingManager = new ForestStakingManager(monToken);
        fMONToken = stakingManager.fMONToken();
        mockAdapter = new AdapterMock(address(fMONToken));
        
        // Setup mock MON token
        vm.mockCall(
            monToken,
            abi.encodeWithSelector(IERC20.transferFrom.selector),
            abi.encode(true)
        );
        vm.mockCall(
            monToken,
            abi.encodeWithSelector(IERC20.transfer.selector),
            abi.encode(true)
        );
        vm.mockCall(
            monToken,
            abi.encodeWithSelector(IERC20.balanceOf.selector),
            abi.encode(STAKE_AMOUNT)
        );
        
        // Setup users with MON tokens
        vm.startPrank(user1);
        vm.mockCall(
            monToken,
            abi.encodeWithSelector(IERC20.allowance.selector, user1, address(stakingManager)),
            abi.encode(STAKE_AMOUNT)
        );
        vm.stopPrank();
    }
    
    function testStake() public {
        vm.startPrank(user1);
        
        stakingManager.stake(STAKE_AMOUNT);
        
        (uint256 staked, uint256 fMON, , ) = stakingManager.getUserInfo(user1);
        assertEq(staked, STAKE_AMOUNT);
        assertEq(fMON, STAKE_AMOUNT); // First staker gets 1:1 ratio
        assertEq(stakingManager.totalStaked(), STAKE_AMOUNT);
        assertEq(stakingManager.totalfMONMinted(), STAKE_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testUnstake() public {
        vm.startPrank(user1);
        
        // First stake
        stakingManager.stake(STAKE_AMOUNT);
        
        // Then unstake half
        uint256 unstakeAmount = STAKE_AMOUNT / 2;
        stakingManager.unstake(unstakeAmount);
        
        (uint256 staked, uint256 fMON, , ) = stakingManager.getUserInfo(user1);
        assertEq(staked, STAKE_AMOUNT / 2);
        assertEq(fMON, STAKE_AMOUNT / 2);
        assertEq(stakingManager.totalStaked(), STAKE_AMOUNT / 2);
        assertEq(stakingManager.totalfMONMinted(), STAKE_AMOUNT / 2);
        
        vm.stopPrank();
    }
    
    function testHarvest() public {
        vm.startPrank(user1);
        
        // Stake tokens
        stakingManager.stake(STAKE_AMOUNT);
        
        // Fast forward time to accumulate rewards
        skip(365 days); // 1 year
        
        // Harvest rewards
        stakingManager.harvest();
        
        // Check that fMON balance increased
        uint256 fMONBalance = fMONToken.balanceOf(user1);
        assertGt(fMONBalance, STAKE_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testStakeToAdapter() public {
        vm.startPrank(user1);
        
        // First stake to get fMON
        stakingManager.stake(STAKE_AMOUNT);
        
        // Approve fMON for adapter
        fMONToken.approve(address(mockAdapter), STAKE_AMOUNT);
        
        // Stake fMON to adapter
        stakingManager.stakeToAdapter(STAKE_AMOUNT / 2, address(mockAdapter));
        
        // Check adapter has fMON
        assertEq(fMONToken.balanceOf(address(mockAdapter)), STAKE_AMOUNT / 2);
        
        vm.stopPrank();
    }
    
    function testUnstakeFromAdapter() public {
        vm.startPrank(user1);
        
        // First stake to get fMON
        stakingManager.stake(STAKE_AMOUNT);
        
        // Approve fMON for adapter
        fMONToken.approve(address(mockAdapter), STAKE_AMOUNT);
        
        // Stake fMON to adapter
        stakingManager.stakeToAdapter(STAKE_AMOUNT / 2, address(mockAdapter));
        
        // Unstake from adapter
        uint256 shares = mockAdapter.getShares(user1);
        stakingManager.unstakeFromAdapter(shares, address(mockAdapter));
        
        // Check user got fMON back
        assertEq(fMONToken.balanceOf(user1), STAKE_AMOUNT / 2);
        
        vm.stopPrank();
    }
    
    function testHarvestCooldown() public {
        vm.startPrank(user1);
        
        // Stake tokens
        stakingManager.stake(STAKE_AMOUNT);
        
        // Fast forward time
        skip(365 days);
        
        // First harvest should succeed
        stakingManager.harvest();
        
        // Second harvest should fail due to cooldown
        vm.expectRevert("Harvest cooldown not met");
        stakingManager.harvest();
        
        // Wait for cooldown to pass
        skip(1 days);
        
        // Now harvest should succeed
        stakingManager.harvest();
        
        vm.stopPrank();
    }
    
    function testMultipleUsers() public {
        // User 1 stakes
        vm.startPrank(user1);
        stakingManager.stake(STAKE_AMOUNT);
        vm.stopPrank();
        
        // User 2 stakes
        vm.startPrank(user2);
        vm.mockCall(
            monToken,
            abi.encodeWithSelector(IERC20.allowance.selector, user2, address(stakingManager)),
            abi.encode(STAKE_AMOUNT)
        );
        stakingManager.stake(STAKE_AMOUNT);
        vm.stopPrank();
        
        // Check total staked
        assertEq(stakingManager.totalStaked(), STAKE_AMOUNT * 2);
        assertEq(stakingManager.totalfMONMinted(), STAKE_AMOUNT * 2);
        
        // Check individual balances
        (uint256 staked1, , , ) = stakingManager.getUserInfo(user1);
        (uint256 staked2, , , ) = stakingManager.getUserInfo(user2);
        assertEq(staked1, STAKE_AMOUNT);
        assertEq(staked2, STAKE_AMOUNT);
    }
    
    function test_RevertWhen_StakeZeroAmount() public {
        vm.startPrank(user1);
        vm.expectRevert("Amount must be greater than 0");
        stakingManager.stake(0);
        vm.stopPrank();
    }
    
    function test_RevertWhen_UnstakeInsufficientfMON() public {
        vm.startPrank(user1);
        vm.expectRevert("Insufficient fMON");
        stakingManager.unstake(STAKE_AMOUNT);
        vm.stopPrank();
    }
    
    function test_RevertWhen_HarvestNoRewards() public {
        vm.startPrank(user1);
        vm.expectRevert("No rewards to harvest");
        stakingManager.harvest();
        vm.stopPrank();
    }
}
