// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Naturo} from "../src/Naturo.sol";

contract NaturoTest is Test {
    Naturo public naturo;

    address public owner = address(1);
    address public minter = address(2);
    address public user = address(3);

    function setUp() public {
        vm.prank(owner);
        naturo = new Naturo( "ipfs://CID/{id}.json", owner);
    }
    function testSetMaxSupply() public {
        vm.prank(owner);
        naturo.setMaxSupply(1, 100);
        assertEq(naturo.maxSupply(1), 100);
    }
    function testMintSuccess() public {
        vm.prank(owner);
        naturo.setMaxSupply(1, 100);

        vm.prank(owner);
        naturo.setMinter(minter, true);

        vm.prank(minter);
        naturo.mint(user, 1, 10);

        assertEq(naturo.totalMinted(1), 10);
    }
}