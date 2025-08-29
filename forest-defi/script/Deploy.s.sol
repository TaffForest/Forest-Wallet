// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/fMON.sol";
import "../src/ForestStakingManager.sol";
import "../src/adapters/AdapterMock.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address monToken = vm.envAddress("MON_TOKEN_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy fMON token
        fMON fMONToken = new fMON();
        console.log("fMON Token deployed at:", address(fMONToken));
        
        // Deploy Forest Staking Manager
        ForestStakingManager stakingManager = new ForestStakingManager(monToken);
        console.log("Forest Staking Manager deployed at:", address(stakingManager));
        
        // Deploy Mock Adapter
        AdapterMock mockAdapter = new AdapterMock(address(fMONToken));
        console.log("Mock Adapter deployed at:", address(mockAdapter));
        
        vm.stopBroadcast();
        
        console.log("=== Deployment Summary ===");
        console.log("fMON Token:", address(fMONToken));
        console.log("Forest Staking Manager:", address(stakingManager));
        console.log("Mock Adapter:", address(mockAdapter));
        console.log("MON Token:", monToken);
    }
}
