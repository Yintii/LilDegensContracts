// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract LilDegenStake is IERC721Receiver {
    IERC721Enumerable public nft;
    IERC20 public rewardToken;

    struct RewardInfo {
        uint256 lastRewardTime;
        uint256 rewards;
    }

    mapping(uint256 => bool) public isStaked;
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public lastUpdateTime;
    mapping(address => uint256) public rewardsEarned;
    mapping(uint256 => RewardInfo) public allRewards;

    uint256 public rewardRate = 7; // The reward rate is 7 tokens per day
    uint256 public totalStaked;
    uint256 public lastUpdate;

    constructor(IERC721Enumerable _nft, IERC20 _rewardToken) {
        nft = _nft;
        rewardToken = _rewardToken;
        lastUpdate = block.timestamp;
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external override returns (bytes4) {
        require(msg.sender == address(nft), "Only accepts NFT");

        require(!isStaked[tokenId], "Token already staked");

        isStaked[tokenId] = true;
        stakedBalance[from] += 1;
        totalStaked += 1;
        lastUpdateTime[from] = block.timestamp;
        allRewards[tokenId].lastRewardTime = block.timestamp;

        return this.onERC721Received.selector;
    }

    function stake(uint256 tokenId) external {
        require(nft.ownerOf(tokenId) == msg.sender, "You do not own this token");

        nft.safeTransferFrom(msg.sender, address(this), tokenId);
    }

    function unstake(uint256 tokenId) external {
        require(isStaked[tokenId], "Token not staked");
        require(nft.ownerOf(tokenId) == address(this), "Contract does not own token");

        nft.safeTransferFrom(address(this), msg.sender, tokenId);

        isStaked[tokenId] = false;
        stakedBalance[msg.sender] -= 1;
        totalStaked -= 1;
        lastUpdateTime[msg.sender] = block.timestamp;
        allRewards[tokenId].lastRewardTime = block.timestamp;
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
        uint256 totalRewards = rewardsPerSecond * totalStaked * timeElapsed;

        for (uint256 i = 0; i < nft.totalSupply(); i++) {
            uint256 tokenId = nft.tokenByIndex(i);
            if (isStaked[tokenId]) {
                allRewards[tokenId].rewards += rewardsPerSecond * (block.timestamp - allRewards[tokenId].lastRewardTime);
                allRewards[tokenId].lastRewardTime = block.timestamp;
            }
        }

        rewardsEarned[address(this)] += totalRewards;
        lastUpdate = block.timestamp;
    }

    function lastRewardTime(uint256 tokenId) public view returns (uint256){
        return allRewards[tokenId].lastRewardTime;
    }
}

