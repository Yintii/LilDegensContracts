const { expect } = require("chai");
const { ethers } = require("hardhat");
const priceInWei = ethers.utils.parseEther('0.0169');

//make the merkle tree availavle to all tests
const { MerkleTree } = require('merkletreejs');

async function createMerkleRootAndGetUserProofs(
	user1,
	user2,
	user3,
	user4
){

    //create a merkle tree with the 3 addresses
    const merkleTree = new MerkleTree([user1.address, user2.address, user3.address]);

    //get the merkle root
    const merkleRoot = merkleTree.getHexRoot();

    //get the proof for the first address
    const proof1 = merkleTree.getHexProof(user1.address);

    //get the proof for the second address
    const proof2 = merkleTree.getHexProof(user2.address);

    //get the proof for the third address
    const proof3 = merkleTree.getHexProof(user3.address);

    //get the proof for an address that is not in the merkle tree
    const proof4 = merkleTree.getHexProof(user4.address);
	
    //get the proof for the merkle root
    const proofRoot = merkleTree.getHexProof(merkleRoot);

    return [merkleRoot, proof1, proof2, proof3, proof4, proofRoot];

}

describe("LilDegens contracts", function(){
    const mintingStartTime = Math.floor(Date.now() / 1000); //current timestamp when deployed
    const whitelistedMintingEndTime = mintingStartTime + 60 * 60 * 2; //2 hours after deployment 


    let LilDegens;
    let lilDegens;
    let LilDegenCoin;
    let lilDegenCoin;
    let LilDegenStake;
    let lilDegenStake;

    let merkleRoot;

    let owner;
    let user1;
    let user2;
    let user3;
    let user4;
    let proof1;
    let proof2;
    let proof3;
    let proof4;

    


    beforeEach(async function () {
	[owner, user1, user2, user3, user4] = await ethers.getSigners();
	const [merkleRoot, proof1, proof2, proof3, proof4, proofRoot] = await createMerkleRootAndGetUserProofs(
		user1,
		user2,
		user3,
		user4
	);
        LilDegens = await ethers.getContractFactory("LilDegens");
        lilDegens = await LilDegens.deploy(
                                "LilDegens", 
                                "LD",
                                3,
                                priceInWei,
				merkleRoot,
				mintingStartTime,	
				whitelistedMintingEndTime
                            );

        await lilDegens.deployed();

    });

    describe("Minting", function(){
	it("Should not allow user4 to mint before the 2 hours after deployment ", async function(){
	    //expect that if user4 tries to connect and mint before 2 hours have passed on chain, 
	    //that it will say that the whitelist minting is still going on
	    await expect(lilDegens.connect(user4).mint(proof4)).to.be.revertedWith("Whitelist minting is still going on");
	});
    });

});	

