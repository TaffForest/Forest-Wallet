// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {ForestStakingManager} from "../contracts/ForestStakingManager.sol";
import {AdapterMock} from "../contracts/adapters/AdapterMock.sol";

contract DeployAll is Script {
    function run() external {
        address monToken = vm.envAddress("MON_TOKEN_ADDRESS");
        address owner = vm.envAddress("OWNER");
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");

        vm.startBroadcast();               // uses PRIVATE_KEY from env if provided
        
        // Deploy Forest Staking Manager (creates fMON token internally)
        ForestStakingManager mgr = new ForestStakingManager(monToken);
        
        // Deploy AdapterMock with fMON token address
        AdapterMock adapter = new AdapterMock(address(mgr.fMONToken()));
        
        // Set up the adapter on the manager
        mgr.setAdapter(address(adapter), true);
        mgr.setDefaultAdapter(address(adapter));
        
        vm.stopBroadcast();

        console2.log("Manager:", address(mgr));
        console2.log("fMON:", address(mgr.fMONToken()));
        console2.log("AdapterMock:", address(adapter));
        console2.log("MON Token:", monToken);
        console2.log("Owner:", owner);
        console2.log("Fee Recipient:", feeRecipient);
    }
}
