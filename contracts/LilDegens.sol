// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ILilDegenCoin {
    function burn(address _from, uint256 _amount) external;
    function updateReward(address _from, address _to) external;
}

contract LilDegens is ERC721A, Ownable, Pausable, ReentrancyGuard {
    using Strings for uint256;
    using Address for address;

    string private baseURI;
    uint256 public maxSupply = 6969;
    uint256 public immutable maxPerAddressDuringMint;
    uint256 public price;

    mapping(address => uint256) public genBalance;

    struct LilDegenData {
        string name;
    }

    modifier LilDegenOwner(uint256 tokenId) {
        require(
            ownerOf(tokenId) == msg.sender,
            "Cannot interact with a LilDegen you do not own"
        );
        _;
    }

    ILilDegenCoin public LilDegenCoin;

    uint256 public constant NAME_CHANGE_PRICE = 150 ether;

    mapping(uint256 => LilDegenData) public lilDegenData;

    event NameChanged(uint256 LilDegenId, string LilDegenName);

    constructor(
        string memory name,
        string memory symbol,
        uint256 maxBatchSize_,
        uint256 mintPrice_
    )
        ERC721A(name, symbol, maxBatchSize_, maxSupply)
    {
        maxPerAddressDuringMint = maxBatchSize_;
        price = mintPrice_;
    }

    function changeName(uint256 LilDegenId, string memory newName)
        external
        LilDegenOwner(LilDegenId)
    {
        bytes memory n = bytes(newName);
        require(n.length > 0 && n.length < 25, "Invalid name length");
        require(
            sha256(n) != sha256(bytes(lilDegenData[LilDegenId].name)),
            "New name is same as current name"
        );

        LilDegenCoin.burn(msg.sender, NAME_CHANGE_PRICE);
        lilDegenData[LilDegenId].name = newName;
        emit NameChanged(LilDegenId, newName);
    }

    function setLilDegenCoin(address LilDegenCoinAddress) external onlyOwner {
        LilDegenCoin = ILilDegenCoin(LilDegenCoinAddress);
    }

    function mint(uint256 numberOfMints) external payable {
        require(totalSupply() + numberOfMints <= maxSupply);
        //this line will make sure the user cannot buy anymore than {maxBatchSize_}
        require(
            numberMinted(msg.sender) + numberOfMints <= maxPerAddressDuringMint,
            "Limit number of mints to an amount set on contract configuration"
        );
        require(
            msg.value >= price * numberOfMints,
            "Ether value sent is below the price"
        );
        _safeMint(msg.sender, numberOfMints);
        genBalance[msg.sender]++;
    }

    function gift(uint256 numberOfMints, address _to) public onlyOwner {
        require(
            totalSupply() + numberOfMints <= maxSupply,
            "Purchase would exceed max supply of LilDegens"
        );
        _safeMint(_to, numberOfMints);
        genBalance[msg.sender]++;
    }

    function walletOfOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokensId = new uint256[](tokenCount);
        for (uint256 i; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokensId;
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        if (tokenId < maxSupply) {
            LilDegenCoin.updateReward(from, to);
            genBalance[from]--;
            genBalance[to]++;
        }
        ERC721A.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override {
        if (tokenId < maxSupply) {
            LilDegenCoin.updateReward(from, to);
            genBalance[from]--;
            genBalance[to]++;
        }
        ERC721A.safeTransferFrom(from, to, tokenId, data);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    function setPrice(uint256 newPrice) public onlyOwner {
        price = newPrice;
    }

    function setBaseURI(string memory uri) public onlyOwner {
        baseURI = uri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function numberMinted(address owner) public view returns (uint256) {
        return _numberMinted(owner);
    }
}
