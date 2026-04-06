// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "../lib/openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {Strings} from "../lib/openzeppelin-contracts/contracts/utils/Strings.sol";

contract Naturo is ERC1155, Ownable{
    mapping(uint256 => uint256) public maxSupply; //max supply for each token id
    mapping(uint256 => uint256) public totalMinted; //total minted for each token id
    mapping(address => bool) public isMinter;

    string private _base;
    bool public paused = true;

    error NotMinter();
    error Paused();
    error CapExceeded();
    error CapNotSet();

    event MinterSet(address indexed minter, bool canMint);
    event MaxSupplySet(uint256 indexed id, uint256 supply);
    event PausedSet(bool paused);
    event Minted(address indexed to, uint256 indexed id, uint256 amount);

    modifier onlyMinter() {
        if (!isMinter[msg.sender]) revert NotMinter();
        _;
    }

    constructor(string memory baseUri, address owner_) ERC1155(baseUri) Ownable(owner_) {
        _base = baseUri;
    }

    function uri(uint256 id) public view override returns (string memory) {
        return string(abi.encodePacked(_base, Strings.toString(id), ".json"));
    }

    function getTotalMinted(uint256 id) external view returns (uint256) {
        return totalMinted[id];
    }

    function getMaxSupply(uint256 id) external view returns (uint256) {
        return maxSupply[id];
    }

    function setMinter(address minter, bool canMint) external onlyOwner {
        isMinter[minter] = canMint;
        emit MinterSet(minter, canMint);
    }
    function setPaused(bool v) external onlyOwner{
        paused = v;
        emit PausedSet(v);
    }

    function setMaxSupply(uint256 id, uint256 supply) external onlyOwner {
        maxSupply[id] = supply;
        emit MaxSupplySet(id, supply);
    }

    function mint(address to, uint256 id, uint256 amount) external onlyMinter {
        if (paused) revert Paused();
        uint256 cap = maxSupply[id];
        if (cap == 0) revert CapNotSet();
        if (totalMinted[id] + amount > cap) revert CapExceeded();
        totalMinted[id] += amount;
        _mint(to, id, amount, "");
        emit Minted(to, id, amount);
    }
}
