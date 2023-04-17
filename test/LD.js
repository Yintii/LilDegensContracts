const { expect } = require("chai");
const { ethers } = require("hardhat");
const priceInWei = ethers.utils.parseEther('0.0169');

describe("LilDegens Contract", function () {
    let LilDegens;
    let lilDegens;
    let LilDegenCoin;
    let lilDegenCoin;

    beforeEach(async function () {
        LilDegens = await ethers.getContractFactory("LilDegens");
        lilDegens = await LilDegens.deploy(
                                "LilDegens", 
                                "LD",
                                3,
                                priceInWei
                            );

        await lilDegens.deployed();


        LilDegenCoin = await ethers.getContractFactory("LilDegenCoin");
        lilDegenCoin = await LilDegenCoin.deploy(lilDegens.address);

        await lilDegenCoin.deployed();


    });


    describe("mint()", function () {
        it("should allow a user to mint a LilDegen", async ()=>{
            
            const [owner, user1] = await ethers.getSigners();
            const initialSupply = await lilDegens.totalSupply();
            const amountToMint = 1;


            await lilDegens
                    .connect(user1)
                    .mint(
                        amountToMint, 
                        { value: priceInWei.mul(amountToMint) }
                    );
            

            const finalSupply = await lilDegens.totalSupply();
            expect(finalSupply).to.equal(initialSupply + amountToMint);
        });

        it("should allow for exactly 3 to be minted", async ()=>{
            const [owner, user1] = await ethers.getSigners();
            const initialSupply = await lilDegens.totalSupply();
            amountToMint = 3;

            await lilDegens.connect(user1)
                .mint(
                    amountToMint,
                    { value: priceInWei.mul(amountToMint) }
                );


            const finalSupply = await lilDegens.totalSupply();
            expect(finalSupply).to.equal(initialSupply + amountToMint);
        });

        it("should not allow for more than 3 to be minted", async ()=>{
            const [owner, user1] = await ethers.getSigners();
            const initialSupply = await lilDegens.totalSupply();
            amountToMint = 4;

            try {
                await lilDegens
                    .connect(user1)
                    .mint(
                        amountToMint,
                        { value: priceInWei.mul(amountToMint) }
                    );
                expect.fail(
                    "This should have failed to mint more than 3"
                );
            } catch (error) {
                expect(error.message)
                    .to
                    .equal(
                        "VM Exception while processing transaction: reverted with reason string 'Limit number of mints to an amount set on contract configuration'"
                    );
            }
        })

        it("should allow for a bunch of users to each mint 3 LilDegens", async () => {
            const [owner, user1, user2, user3, user4] = await ethers.getSigners();

            const minters = [user1, user2, user3, user4];

            const amountToMint = 3;

            let promises = minters.map( async (minter) => {
                await lilDegens.connect(minter)
                                .mint(
                                    amountToMint,
                                    { value: priceInWei.mul(amountToMint)}
                                );
            });
            await Promise.all(promises);
        })

        it("should fail to mint if no ether is sent", async () => {
            const [owner, user1] = await ethers.getSigners();

            try {
                await lilDegens
                    .connect(user1)
                    .mint(1);
            } catch (error) {
                expect(error.message)
                    .to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Ether value sent is below the price'"
                    )
            }

        })

        it("should fail to mint if the wrong amount of ether is sent", async () => {
            const [owner, user1] = await ethers.getSigners();

            try{
                await lilDegens
                        .connect(user1)
                        .mint(1, {value: ethers.utils.parseEther('0.00169')});
            }catch(error){
                expect(error.message)
                    .to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Ether value sent is below the price'"
                    )
            }

        })

        /**
         * to test this, change the amount you allow to be minted to 
         * be a 6969
         */
        // it('should not allow minting once supply has run out', async () =>{
    
        //     let [,user1, user2] = await ethers.getSigners();
        //     try {
                
        //         await lilDegens
        //             .connect(user1)
        //             .mint(
        //                 6969,
        //                 { value: priceInWei.mul(6969) }
        //             );

        //         await lilDegens
        //             .connect(user2)
        //             .mint(
        //                 1,
        //                 { value: priceInWei }
        //             );
                    

        //         expect.fail('This should have failed, exceeding the max supply')

        //     } catch (error) {
        //         expect(error.message)
        //             .to
        //             .equal(
        //                 "VM Exception while processing transaction: reverted with reason string 'Purchase would exceed max supply of LilDegens'"                    );
        //     }
        // })

    });

    describe("gift()", function () {
        it('should allow for the owner to gift a lildegen', async () => {
            const [owner, user1] = await ethers.getSigners();
            const amountToGift = 1;


            await lilDegens
                .connect(owner)
                .gift(
                    amountToGift,
                    user1.address
                );
                        
        })
        it('should NOT allow for the owner to gift more than 3 lildegens', async () => {
            const [owner, user1] = await ethers.getSigners();
            const amountToGift = 4;

            try {
                await lilDegens
                    .connect(owner)
                    .gift(
                        amountToGift,
                        user1.address
                    );

                expect.fail('This should have failed to mint more than 3, even as a gift');
            } catch (error) {
                expect(error.message)
                    .to
                    .equal(
                        "VM Exception while processing transaction: reverted with reason string 'ERC721A: quantity to mint too high'"
                    );
            }

        })
        it('should only allow for the owner to gift', async () => {
            const [owner, user1] = await ethers.getSigners();
            try{
                await lilDegens
                        .connect(user1)
                        .gift(
                            3,
                            user1.address
                        );
                expect.fail(
                    "Only the owner should be able to gift"
                );
            } catch(error){
                expect(error.message)
                    .to
                    .equal(
                        "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'"
                    );
            }
        })
        it("should allow for exactly 3 to be gifted", async () => {
            const [owner, user1] = await ethers.getSigners();
            const initialSupply = await lilDegens.totalSupply();
            amountToGift = 3;
            await lilDegens.connect(owner)
                .gift(
                    amountToGift,
                    user1.address
                );
            const finalSupply = await lilDegens.totalSupply();
            expect(finalSupply).to.equal(initialSupply + amountToGift);
        });
    });

    describe("changeName()", function(){
        it("should allow for you to rename the token", async () => {
            const [owner, user1] = await ethers.getSigners();

            await lilDegens
                .connect(owner)
                .setLilDegenCoin(lilDegenCoin.address);

            await lilDegens
                .connect(user1)
                .mint(1, {value: priceInWei})
            
            await lilDegenCoin
                .connect(user1)
                .claimReward()

            await lilDegens
                .connect(user1)
                .changeName(0, "DudeMan McGoophy");

        })
    });

    describe("management", function(){
        
        it('should allow the owner to PAUSE and UNPAUSE the contract', async () => {
            const [owner] = await ethers.getSigners();

            await lilDegens
                    .connect(owner)
                    .pause()

            await lilDegens
                    .connect(owner)
                    .unpause()
        })

        it('should NOT allow anyone besides the owner to PAUSE the contract', async () => {
            const [owner, user1] = await ethers.getSigners();

            try {
                await lilDegens
                    .connect(user1)
                    .pause()

                expect.fail('A user should not be able to pause the contract');
            } catch (error) {
                expect(error.message)
                    .to
                    .equal(
                        "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'"
                    );
            }

        })

        it('should NOT allow anyone besides the owner to UNPAUSE the contract', async () => {
            const [owner, user1] = await ethers.getSigners();

            try {
                await lilDegens
                    .connect(owner)
                    .pause();


                await lilDegens
                    .connect(user1)
                    .unpause();

                expect.fail('A user should not be able to unpause the contract');
            } catch (error) {
                expect(error.message)
                    .to
                    .equal(
                        "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'"
                    );
            }

        })
        
        it('should not allow anyone else besides the owner to withdraw funds', async () => {
            const [owner, user1, user2] = await ethers.getSigners();

            amountToMint = 1;

            await lilDegens.connect(user1)
                .mint(
                    amountToMint,
                    { value: priceInWei.mul(amountToMint) }
                );

            await lilDegens.connect(user2)
                .mint(
                    amountToMint,
                    { value: priceInWei.mul(amountToMint) }
                );
3

            let user1Fail = false;
            let user2Fail = false;

            try{
                await lilDegens
                        .connect(user1)
                        .withdraw()
            }catch(error){
                user1Fail = true;
            }
            
            try {
                await lilDegens
                    .connect(user2)
                    .withdraw()
            } catch (error) {
                user2Fail = true;
            }

            if(user1Fail == false || user2Fail == false){
                throw new Error('One of the users was able to withdraw funds!!!')
            }

            await lilDegens
                    .connect(owner)
                    .withdraw();
        }) 

        it('should not allow anyone else besides the owner to setBaseURI', async () => {
            const [owner, user1, user2] = await ethers.getSigners();

            let user1Fail = false;
            let user2Fail = false;

            try {
                await lilDegens
                    .connect(user1)
                    .setBaseURI('https://lemonparty.org');
            } catch (error) {
                user1Fail = true;
            }

            try {
                await lilDegens
                    .connect(user2)
                    .setBaseURI('https://2girls1cup.com');
            } catch (error) {
                user2Fail = true;
            }

            if(user1Fail == false || user2Fail == false){
                throw new Error(
                    "Users were able to change the baseURI!!!"
                );
            }

            await lilDegens
                .connect(owner)
                .setBaseURI(
                    "ipfs://goodlink.com"
                );
        })

        it('should not allow anyone else besides the owner to setPrice', async () => {
            const [owner, user1, user2] = await ethers.getSigners();

            let user1Fail = false;
            let user2Fail = false;

            const correctPrice = ethers.utils.parseEther('0.0169');

            await lilDegens
                .connect(owner)
                .setPrice(correctPrice);


            let badPrice = ethers.utils.parseEther('100');
            try {
                await lilDegens
                    .connect(user1)
                    .setPrice(badPrice)
            } catch (error) {
                user1Fail = true;
            }

            badPrice = ethers.utils.parseEther('2000');

            try {
                await lilDegens
                    .connect(user2)
                    .setPrice(badPrice);
            } catch (error) {
                user2Fail = true;
            }

            if (user1Fail == false || user2Fail == false) {
                throw new Error(
                    "Users were able to change the price!!!"
                );
            }
        })

        it('should not allow anyone else besides the owner to setLilDegenCoin Address', async () => {
            const [owner, user1, user2] = await ethers.getSigners();

            let user1Fail = false;
            let user2Fail = false;


            await lilDegens
                .connect(owner)
                .setLilDegenCoin('0xa0ABF54E10E2088256819f1bff7AF4f324Ca3FdA');


            try {
                await lilDegens
                    .connect(user1)
                    .setLilDegenCoin('0xA6dF85aE35c8d61Cd16EC49aAf9dA63D73A3CF86');
            } catch (error) {
                user1Fail = true;
            }


            try {
                await lilDegens
                    .connect(user2)
                    .setLilDegenCoin('0x3D3a58A16c243fE23b52b90Afb850159A37d7446');
            } catch (error) {
                user2Fail = true;
            }

            if (user1Fail == false || user2Fail == false) {
                throw new Error(
                    "Users were able to change the LilDegenCoin address!!!"
                );
            }
        })
    });
});