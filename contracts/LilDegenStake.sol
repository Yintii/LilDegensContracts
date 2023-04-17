// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract LilDegenStake {
    IERC721 public nft;
    IERC20 public rewardToken;

    mapping(uint256 => bool) public isStaked;
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public lastUpdateTime;
    mapping(address => uint256) public rewardsEarned;

    uint256 public rewardRate = 100; // The reward rate is 100 reward tokens per day
    uint256 public totalStaked;
    uint256 public lastUpdate;

    constructor(IERC721 _nft, IERC20 _rewardToken) {
        nft = _nft;
        rewardToken = _rewardToken;
        lastUpdate = block.timestamp;
    }

    function stake(uint256 tokenId) external {
        require(nft.ownerOf(tokenId) == msg.sender, "You do not own this token");
        require(!isStaked[tokenId], "Token already staked");

        nft.transferFrom(msg.sender, address(this), tokenId);

        isStaked[tokenId] = true;
        stakedBalance[msg.sender] += 1;
        totalStaked += 1;
        lastUpdateTime[msg.sender] = block.timestamp;
    }

    function unstake(uint256 tokenId) external {
        require(isStaked[tokenId], "Token not staked");
        require(nft.ownerOf(tokenId) == address(this), "Contract does not own token");

        nft.transferFrom(address(this), msg.sender, tokenId);

        isStaked[tokenId] = false;
        stakedBalance[msg.sender] -= 1;
        totalStaked -= 1;
        lastUpdateTime[msg.sender] = block.timestamp;
    }

    function claimRewards() external {
        uint256 rewards = calculateRewards(msg.sender);

        if (rewards > 0) {
            rewardsEarned[msg.sender] = 0;
            rewardToken.transfer(msg.sender, rewards);
        }
    }

    function calculateRewards(address account) public view returns (uint256) {
        uint256 stakedTime = block.timestamp - lastUpdateTime[account];
        uint256 stakedAmount = stakedBalance[account];

        return rewardsEarned[account] + stakedTime * stakedAmount * rewardRate / (1 days);
    }

    function updateRewards() internal {
        uint256 rewardsPerSecond = rewardRate / (1 days);
        uint256 timeElapsed = block.timestamp - lastUpdate;
        uint256 rewards = rewardsPerSecond * totalStaked * timeElapsed;

        rewardsEarned[address(this)] += rewards;
        lastUpdate = block.timestamp;
    }
}
