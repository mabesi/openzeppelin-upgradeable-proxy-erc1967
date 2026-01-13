// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract OZMultiToken is Initializable, ERC1155Upgradeable, ERC1155BurnableUpgradeable, OwnableUpgradeable, ERC1155SupplyUpgradeable {

    // MT: Multi Token type identifier
    uint public constant MT_0 = 0;
    uint public constant MT_1 = 1;
    uint public constant MT_2 = 2;

    uint public tokenPrice;
    uint public maxSupply;

    // Change the URI address for your own address
    string public constant BASE_URL = "ipfs://mybaseurladdress/";
    
    // Contract Functions ==========================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __ERC1155_init(BASE_URL);
        __ERC1155Burnable_init();
        __Ownable_init();
        __ERC1155Supply_init();
        tokenPrice = 0.01 ether;
        maxSupply = 50;
    }    

    function mint(uint256 id) external payable {
        
        require(id < 3, "This token does not exists");
        require(msg.value >= tokenPrice, "Insufficient payment");
        require(totalSupply(id) < maxSupply, "Max supply reached");

        _mint(msg.sender, id, 1, "");
    }

    // Overrided function to change to a static URI
    // The {0} key pattern was not used because of problems with various
    // Web3 clients and marketplaces, like OpenSea
    function uri(uint256 id) public pure override returns (string memory) {
        require(id < 3, "This token does not exists");
        return string.concat(BASE_URL, Strings.toString(id), ".json");
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal
        override(ERC1155Upgradeable, ERC1155SupplyUpgradeable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        address payable recipent = payable(owner());
        (bool success,) = recipent.call{value: amount}("");
        require(success == true, "Failed to withdraw");
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

}