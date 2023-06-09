const { expect } = require("chai");
const { ethers } = require("hardhat");
const priceInWei = ethers.utils.parseEther('0.0169');
//timestamp representing 5/26/2023 @ 4:20pm (PST)
const startTime = new Date('May 26, 2023 16:20:00 GMT-0700');
const timeStamp = Math.round(startTime.getTime() / 1000);
console.log(timeStamp);
describe("LilDegens Contract", function () {
    let LilDegens;
    let lilDegens;
    let LilDegenCoin;
    let lilDegenCoin;
    let LilDegenStake;
    let lilDegenStake;

    beforeEach(async function () {
        LilDegens = await ethers.getContractFactory("LilDegens");
        lilDegens = await LilDegens.deploy(
            "LilDegens",
            "LD",
            3,
            priceInWei,
            timeStamp
        );

        await lilDegens.deployed();


        LilDegenCoin = await ethers.getContractFactory("LilDegenCoin");
        lilDegenCoin = await LilDegenCoin.deploy(lilDegens.address, 1_000_000_000);

        await lilDegenCoin.deployed();



        LilDegenStake = await ethers.getContractFactory("LilDegenStake");
        lilDegenStake = await LilDegenStake.deploy(lilDegens.address, lilDegenCoin.address);

        await lilDegenStake.deployed();

        //simulate 4 hours passing on the blockchain
        await ethers.provider.send("evm_increaseTime", [4 * 60 * 60]);

    });


    describe("mint()", function () {
        it("should allow a user to mint a LilDegen", async () => {

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

        it("should allow for exactly 3 to be minted", async () => {
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

        it("should not allow for more than 3 to be minted", async () => {
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

            let promises = minters.map(async (minter) => {
                await lilDegens.connect(minter)
                    .mint(
                        amountToMint,
                        { value: priceInWei.mul(amountToMint) }
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

            try {
                await lilDegens
                    .connect(user1)
                    .mint(1, { value: ethers.utils.parseEther('0.00169') });
            } catch (error) {
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
            try {
                await lilDegens
                    .connect(user1)
                    .gift(
                        3,
                        user1.address
                    );
                expect.fail(
                    "Only the owner should be able to gift"
                );
            } catch (error) {
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

    describe("changeName()", function () {
        it("should not allow for you to rename the token if you don't have any ERC20", async () => {
            const [owner, user1] = await ethers.getSigners();

            await lilDegens
                .connect(owner)
                .setLilDegenCoin(lilDegenCoin.address);

            await lilDegens
                .connect(user1)
                .mint(1, { value: priceInWei })

            try {
                await lilDegens
                    .connect(user1)
                    .changeName(0, "DudeMan McGoophy");

                expect.fail("This was supposed to fail due to a lack of balance")
            } catch (error) {
                expect(error.message)
                    .to
                    .equal("VM Exception while processing transaction: reverted with reason string 'ERC20: burn amount exceeds balance'");
            }
        })

        it("should allow for you to rename the token if you DO have enough ERC20", async () => {
            const [owner, user1] = await ethers.getSigners();


            await lilDegens
                .connect(owner)
                .setLilDegenCoin(lilDegenCoin.address);


            await lilDegens
                .connect(user1)
                .mint(1, { value: priceInWei })

            await lilDegenCoin
                .connect(owner)
                .transfer(user1.address, 150);

            let theBal = await lilDegenCoin.balanceOf(user1.address);

            expect(theBal).to.equal(150);

            await lilDegens
                .connect(user1)
                .changeName(0, "DudeMan McGoophy");

        })

        it("should not allow for you to rename the token if you don't have enough ERC20", async () => {
            const [owner, user1] = await ethers.getSigners();

            await lilDegens
                .connect(owner)
                .setLilDegenCoin(lilDegenCoin.address);


            await lilDegens
                .connect(user1)
                .mint(1, { value: priceInWei })

            await lilDegenCoin
                .connect(owner)
                .transfer(user1.address, 10);

            let theBal = await lilDegenCoin.balanceOf(user1.address);

            expect(theBal).to.equal(10);

            try {
                await lilDegens
                    .connect(user1)
                    .changeName(0, "DudeMan McGoophy");

                expect.fail('This should fail because there are not enough tokens ');
            } catch (error) {
                expect(error.message)
                    .to
                    .equal(
                        "VM Exception while processing transaction: reverted with reason string 'ERC20: burn amount exceeds balance'"
                    );
            }


        })
    });

    describe("changeBio()", function () {
        it("should not allow for you to change the bio if you don't have any ERC20", async () => {
            const [owner, user1] = await ethers.getSigners();

            await lilDegens
                .connect(owner)
                .setLilDegenCoin(lilDegenCoin.address);

            await lilDegens
                .connect(user1)
                .mint(1, { value: priceInWei })

            try {
                await lilDegens
                    .connect(user1)
                    .changeBio(0, "DudeMan McGoophy's bio hahahahahaha");

                expect.fail("This was supposed to fail due to a lack of balance")
            } catch (error) {
                expect(error.message)
                    .to
                    .equal("VM Exception while processing transaction: reverted with reason string 'ERC20: burn amount exceeds balance'");
            }
        })
        it("should NOT allow for you to change the bio if you DON'T have enough ERC20", async () => {
            const [owner, user1] = await ethers.getSigners();


            await lilDegens
                .connect(owner)
                .setLilDegenCoin(lilDegenCoin.address);


            await lilDegens
                .connect(user1)
                .mint(1, { value: priceInWei })

            await lilDegenCoin
                .connect(owner)
                .transfer(user1.address, 180);

            let theBal = await lilDegenCoin.balanceOf(user1.address);

            expect(theBal).to.equal(180);

            try {
                await lilDegens
                    .connect(user1)
                    .changeBio(0, "DudeMan McGoophy's bio broooo hahaha");

            } catch (error) {
                expect(error.message)
                    .to
                    .equal("VM Exception while processing transaction: reverted with reason string 'ERC20: burn amount exceeds balance'");
            }

        });
        it("should allow for you to change the bio if you DO have enough ERC20", async () => {
            const [owner, user1] = await ethers.getSigners();


            await lilDegens
                .connect(owner)
                .setLilDegenCoin(lilDegenCoin.address);


            await lilDegens
                .connect(user1)
                .mint(1, { value: priceInWei })

            await lilDegenCoin
                .connect(owner)
                .transfer(user1.address, 200);

            let theBal = await lilDegenCoin.balanceOf(user1.address);

            expect(theBal).to.equal(200);

            await lilDegens
                .connect(user1)
                .changeBio(0, "DudeMan McGoophy's bio broooo hahaha");

        });
    });

    describe("staking", function () {
        it("should allow a user to stake their NFT and earn rewards and unstake afterwards", async () => {
            const [owner, user1] = await ethers.getSigners();
            const tokenId = 0;

            await lilDegens
                .connect(user1)
                .mint(1, { value: priceInWei })

            await lilDegens
                .connect(user1)
                .approve(lilDegenStake.address, tokenId);

            await lilDegenStake
                .connect(user1)
                .stake(tokenId)

            expect(await lilDegenStake.stakedBalance(user1.address)).to.equal(1);
            expect(await lilDegenStake.lastRewardTime(tokenId)).to.be.closeTo(
                Math.floor(Date.now() / 1000),
                200
            );

            //wait a day
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            expect(await lilDegenStake.calculateRewards(user1.address)).to.equal(7);

            await ethers.provider.send("evm_increaseTime", [(24 * 60 * 60) * 3]);
            await ethers.provider.send("evm_mine");

            expect(await lilDegenStake.calculateRewards(user1.address)).to.equal(28);

            await lilDegenStake
                .connect(user1)
                .unstake(tokenId)
        });


    });

    describe("management", function () {

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

            try {
                await lilDegens
                    .connect(user1)
                    .withdraw()
            } catch (error) {
                user1Fail = true;
            }

            try {
                await lilDegens
                    .connect(user2)
                    .withdraw()
            } catch (error) {
                user2Fail = true;
            }

            if (user1Fail == false || user2Fail == false) {
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

            if (user1Fail == false || user2Fail == false) {
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

        it('should not allow anyone else besides the owner to setNameChangePrice', async () => {
            const [owner, user1, user2] = await ethers.getSigners();

            let user1Fail = false;
            let user2Fail = false;

            const correctPrice = ethers.utils.parseEther('0.0169');

            await lilDegens
                .connect(owner)
                .setNameChangePrice(correctPrice);

            try {
                await lilDegens
                    .connect(user1)
                    .setNameChangePrice(correctPrice);
            } catch (error) {
                user1Fail = true;
            }

            try {
                await lilDegens
                    .connect(user2)
                    .setNameChangePrice(correctPrice);
            } catch (error) {
                user2Fail = true;
            }

            if (user1Fail == false || user2Fail == false) {
                throw new Error(
                    "Users were able to change the bio change price!!!"
                );
            }
        });

        it('should not allow anyone else besides the owner to setBioChangePrice', async () => {
            const [owner, user1, user2] = await ethers.getSigners();

            let user1Fail = false;
            let user2Fail = false;

            const correctPrice = ethers.utils.parseEther('0.0169');

            await lilDegens
                .connect(owner)
                .setBioChangePrice(correctPrice);

            try {
                await lilDegens
                    .connect(user1)
                    .setBioChangePrice(correctPrice);
            } catch (error) {
                user1Fail = true;
            }

            try {
                await lilDegens
                    .connect(user2)
                    .setBioChangePrice(correctPrice);
            } catch (error) {
                user2Fail = true;
            }

            if (user1Fail == false || user2Fail == false) {
                throw new Error(
                    "Users were able to change the bio change price!!!"
                );
            }
        });

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