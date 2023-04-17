// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface iLilDegens {
    function genBalance(address owner) external view returns (uint256);
}

contract LilDegenCoin is ERC20, Ownable {
    iLilDegens public LilDegens;

    uint256 public constant BASE_RATE = 7 ether;
    uint256 public START;
    bool rewardPaused = false;

    mapping(address => uint256) public rewards;
    mapping(address => uint256) public lastUpdate;

    mapping(address => bool) public allowedAddresses;

    constructor(address LilDegensAddress) ERC20("LilDegenCoin", "LDGC") {
        LilDegens = iLilDegens(LilDegensAddress);
        START = block.timestamp;
    }

    function updateReward(address from, address to) external {
        require(msg.sender == address(LilDegens));
        if (from != address(0)) {
            rewards[from] += getPendingReward(from);
            lastUpdate[from] = block.timestamp;
        }
        if (to != address(0)) {
            rewards[to] += getPendingReward(to);
            lastUpdate[to] = block.timestamp;
        }
    }

    function claimReward() external {
        require(!rewardPaused, "Claiming reward has been paused");
        _mint(msg.sender, rewards[msg.sender] + getPendingReward(msg.sender));
        rewards[msg.sender] = 0;
        lastUpdate[msg.sender] = block.timestamp;
    }

    function burn(address user, uint256 amount) external {
        require(
            allowedAddresses[msg.sender] || msg.sender == address(LilDegens),
            "Address does not have permission to burn"
        );
        _burn(user, amount);
    }

    function getTotalClaimable(address user) external view returns (uint256) {
        return rewards[user] + getPendingReward(user);
    }

    //this will need to be altered so that
    //it is getting data from the staked contract
    //on how long that the tokens have been staked to the contract
    function getPendingReward(address user) internal view returns (uint256) {
        return
            (LilDegens.genBalance(user) *
                BASE_RATE *
                (block.timestamp -
                    (lastUpdate[user] >= START ? lastUpdate[user] : START))) /
            86400;
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
}
