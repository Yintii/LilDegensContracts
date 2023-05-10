// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface iLilDegens {
    function genBalance(address owner) external view returns (uint256);
}

contract LilDegenCoin is ERC20, Ownable {
    iLilDegens public LilDegens;

    // won't neeed this constant with the staking contract
    uint256 public constant BASE_RATE = 7 ether;
    uint256 public START;
    bool rewardPaused = false;

    mapping(address => uint256) public rewards;
    mapping(address => uint256) public lastUpdate;

    mapping(address => bool) public allowedAddresses;

    constructor(address LilDegensAddress, uint256 initialSupply) ERC20("LilDegenCoin", "LDGC") {
        LilDegens = iLilDegens(LilDegensAddress);
        START = block.timestamp;
        _mint(msg.sender, initialSupply);
    }

    function burn(address user, uint256 amount) external {
        require(
            allowedAddresses[msg.sender] || msg.sender == address(LilDegens),
            "Address does not have permission to burn"
        );
        _burn(user, amount);
    }

    function setAllowedAddresses(address _address, bool _access)
        public
        onlyOwner
    {
        allowedAddresses[_address] = _access;
    }

    function toggleReward() public onlyOwner {
        rewardPaused = !rewardPaused;
    }

    function updateReward(address transferFrom, address transferTo) external {
        require(msg.sender == address(LilDegens), "Unauthorized caller");
        uint256 transferAmount = balanceOf(transferFrom);
        if (transferAmount > 0 && !rewardPaused) {
            uint256 elapsedTime = block.timestamp - START;
            uint256 reward = (transferAmount * BASE_RATE * elapsedTime) / (365 days);
            rewards[transferTo] += reward;
            lastUpdate[transferTo] = block.timestamp;
        }
    }

    
    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        require(recipient != address(0), "ERC20: transfer to zero address");
        _transfer(_msgSender(), recipient, amount);
        return true;
    }
}
