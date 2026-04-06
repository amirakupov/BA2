// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "forge-std/Script.sol";
import {Naturo} from "../src/Naturo.sol";

contract Deploy is Script{

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PK");
        address owner = vm.envAddress("OWNER");

        vm.startBroadcast(pk);

        Naturo nft = new Naturo(vm.envString("BASE_URI"), owner);

        nft.setMaxSupply(1, 2400);
        nft.setMaxSupply(2, 2400);
        nft.setMaxSupply(3, 2400);
        nft.setMaxSupply(4, 2400);
        nft.setMaxSupply(5, 2400);

        nft.setMinter(vm.envAddress("MINTER"), true);
        nft.setPaused(false);
        //stop
        vm.stopBroadcast();

    }
}
