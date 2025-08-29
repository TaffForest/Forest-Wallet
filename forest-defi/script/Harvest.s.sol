// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ForestStakingManager.sol";

contract HarvestScript is Script {
    function run() external {
        uint256 userPrivateKey = vm.envUint("PRIVATE_KEY");
        address stakingManager = vm.envAddress("STAKING_MANAGER_ADDRESS");
        
        vm.startBroadcast(userPrivateKey);
        
        ForestStakingManager manager = ForestStakingManager(stakingManager);
        
        // Check pending rewards
        address user = vm.addr(userPrivateKey);
        uint256 pendingRewards = manager.getPendingRewards(user);
        
        console.log("User:", user);
        console.log("Pending rewards:", pendingRewards);
        
        if (pendingRewards > 0) {
            // Harvest rewards
            manager.harvest();
            console.log("Rewards harvested successfully!");
        } else {
            console.log("No rewards to harvest");
        }
        
        vm.stopBroadcast();
    }
}
