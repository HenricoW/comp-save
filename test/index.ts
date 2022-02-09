import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { expectRevert } from "@openzeppelin/test-helpers";
import { ethers } from "hardhat";
import { comptrollerAddr, tknAddresses } from "../scripts/deploy";
import { UserAccount, W3Saver } from "../typechain";
import { cTokenABI, compERC20ABI, UserAccountABI, comptrollerABI, eventOnTx } from "../utils";

describe("W3Saver", function () {
  let w3Saver: W3Saver, chainID: number;
  let cdai: Contract, cwbtc: Contract, dai: Contract, wbtc: Contract;
  let wbtc_wSig: Contract, uAccContr: Contract, cmptrllr: Contract;
  let accAddr: string;
  let admin: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress;

  before(async () => {
    chainID = (await ethers.provider.getNetwork()).chainId;
    console.log("chainID: ", chainID);

    const W3Saver = await ethers.getContractFactory("W3Saver");
    w3Saver = await W3Saver.deploy(comptrollerAddr[chainID.toString()]);
    await w3Saver.deployed();

    const Cdai = new ethers.Contract(tknAddresses[chainID.toString()]["cDAI"], cTokenABI, ethers.provider);
    cdai = await Cdai.deployed();

    const Cwbtc = new ethers.Contract(tknAddresses[chainID.toString()]["cwBTC"], cTokenABI, ethers.provider);
    cwbtc = await Cwbtc.deployed();

    cmptrllr = new ethers.Contract(comptrollerAddr[chainID.toString()], comptrollerABI, ethers.provider);
    // cmptrllr = await ethers.getContractAt(comptrollerABI, comptrollerAddr[chainID.toString()]);

    [admin, user1, user2] = await ethers.getSigners();
  });

  it("Should have deployed/connected to the contract(s)", async () => {
    const daiAddr = await cdai.underlying();
    dai = new ethers.Contract(daiAddr, compERC20ABI, ethers.provider);
    const wbtcAddr = await cwbtc.underlying();
    wbtc = new ethers.Contract(wbtcAddr, compERC20ABI, ethers.provider);

    expect(await w3Saver.owner()).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  });

  it("Should create a new account", async () => {
    let userList;

    userList = await w3Saver.historicUserList();
    assert(userList.length === 0);

    const tx = await w3Saver.createAccount();
    const evtArgs = await eventOnTx(tx, "AccountCreated");
    expect(evtArgs?.eoa).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

    accAddr = evtArgs?.account;
    console.log("New user account created at: ", accAddr);

    userList = await w3Saver.historicUserList();
    assert(userList.length === 1);
  });

  it("Should fund the eoa's with test tokens", async () => {
    const wbtcBal0 = await wbtc.balanceOf(user1.address);
    const wbtc_bal = ethers.utils.formatUnits(wbtcBal0, 8);
    // console.log("wbtc bal: ", wbtc_bal);
    // console.log();

    wbtc_wSig = wbtc.connect(admin);
    await wbtc_wSig.allocateTo(user1.address, ethers.utils.parseUnits("3", 8));

    const wbtcBal = await wbtc.balanceOf(user1.address);
    // console.log("wbtc bal: ", ethers.utils.formatUnits(wbtcBal, 8));

    expect(+ethers.utils.formatUnits(wbtcBal, 8)).to.be.gte(1);
  });

  it("Should facilitate user deposit", async () => {
    uAccContr = new ethers.Contract(accAddr, UserAccountABI, ethers.provider);

    // const daiBal = await dai.balanceOf(user1.address);
    // console.log("dai bal: ", ethers.utils.formatUnits(daiBal, 18));
    // console.log();

    await dai.connect(user1).approve(uAccContr.address, ethers.utils.parseEther("50"));
    await uAccContr.connect(user1).fundAccount(dai.address, ethers.utils.parseEther("50"));

    await wbtc.connect(user1).approve(uAccContr.address, ethers.utils.parseUnits("2", 8));
    await uAccContr.connect(user1).fundAccount(wbtc.address, ethers.utils.parseUnits("2", 8));

    const daiBala = await dai.balanceOf(uAccContr.address);
    const btcBala = await wbtc.balanceOf(uAccContr.address);

    // console.log("dai bal: ", ethers.utils.formatUnits(daiBal1, 18));
    // console.log("dai bal (acc): ", ethers.utils.formatUnits(daiBala, 18));

    expect(ethers.utils.formatEther(daiBala)).to.equal("50.0");
    expect(ethers.utils.formatUnits(btcBala, 8)).to.equal("2.0");
  });

  it("Should allow user withdrawal", async () => {
    const daiBal = await dai.balanceOf(user1.address);
    // console.log("dai bal: ", ethers.utils.formatUnits(daiBal, 18));
    // console.log();

    await uAccContr.connect(user1).drawDown(dai.address, ethers.utils.parseEther("20"));

    const daiBal1 = await dai.balanceOf(user1.address);
    const daiBala = await dai.balanceOf(uAccContr.address);

    // console.log("dai bal: ", ethers.utils.formatUnits(daiBal1, 18));
    // console.log("dai bal (acc): ", ethers.utils.formatUnits(daiBala, 18));

    expect(ethers.utils.formatEther(daiBala)).to.equal("30.0");
  });

  it("Should NOT allow user withdrawal", async () => {
    const daiBala = await dai.balanceOf(uAccContr.address);
    // console.log("dai bal (acc): ", ethers.utils.formatUnits(daiBala, 18));
    // console.log();
    // await expectRevert(
    //   uAccContr.connect(user1).drawDown(dai.address, ethers.utils.parseEther("40")),
    //   "UserAccount#drawDown: Insufficient funds"
    // );
    await expectRevert.unspecified(uAccContr.connect(user1).drawDown(dai.address, ethers.utils.parseEther("40")));
  });

  it("Should deposit to savings", async () => {
    const daiBala = await dai.balanceOf(uAccContr.address);
    const btcBala = await wbtc.balanceOf(uAccContr.address);
    // console.log("dai bal (acc): ", ethers.utils.formatUnits(daiBala, 18));
    // console.log("btc bal (acc): ", ethers.utils.formatUnits(btcBala, 8));
    // console.log();

    await uAccContr.connect(user1).deposit(cdai.address, ethers.utils.parseEther("25"));
    await uAccContr.connect(user1).deposit(cwbtc.address, ethers.utils.parseUnits("2", 8));

    const daiBala2 = await dai.balanceOf(uAccContr.address);
    const btcBala2 = await wbtc.balanceOf(uAccContr.address);
    // console.log("dai bal (acc): ", ethers.utils.formatUnits(daiBala2, 18));
    // console.log("btc bal (acc): ", ethers.utils.formatUnits(btcBala2, 8));

    expect(ethers.utils.formatEther(daiBala2)).to.equal("5.0");
  });

  it("Should NOT deposit to savings", async () => {
    await expectRevert.unspecified(uAccContr.connect(user1).deposit(cwbtc.address, ethers.utils.parseUnits("2", 8)));
  });

  it("Should withdraw from savings", async () => {
    const daiBala = await dai.balanceOf(uAccContr.address);
    console.log("dai bal (acc): ", ethers.utils.formatUnits(daiBala, 18));

    await uAccContr.connect(user1).withdraw(cdai.address, ethers.utils.parseEther("5"));
    await uAccContr.connect(user1).withdraw(cwbtc.address, ethers.utils.parseUnits("2", 8));

    const daiBala2 = await dai.balanceOf(uAccContr.address);
    console.log("dai bal (acc): ", ethers.utils.formatUnits(daiBala2, 18));
  });

  it("Should NOT withdraw from savings", async () => {
    await expectRevert.unspecified(uAccContr.connect(user1).withdraw(cwbtc.address, ethers.utils.parseUnits("3", 8)));
  });

  it("Should borrow against savings", async () => {
    // const daiBala = await dai.balanceOf(uAccContr.address);
    // console.log("dai bal (acc): ", ethers.utils.formatUnits(daiBala, 18));
    // console.log();

    await uAccContr.connect(user1).borrow(cdai.address, ethers.utils.parseEther("10.0"));
    // await uAccContr.connect(user1).borrow(cwbtc.address, ethers.utils.parseEther("0.0"));

    const daiBala2 = await dai.balanceOf(uAccContr.address);
    const depBal = await cdai.balanceOfUnderlying(uAccContr.address);
    const borrBal = await cdai.borrowBalanceCurrent(uAccContr.address);

    console.log("dai bal (acc): ", ethers.utils.formatUnits(daiBala2, 18));
    console.log("dai bal OfUnderl: ", ethers.utils.formatUnits(depBal, 18));
    console.log("dai tot borrowed: ", ethers.utils.formatUnits(borrBal, 18));

    const accLiquidity = await cmptrllr.getAccountLiquidity(uAccContr.address);
    const [error, liq, shortfall] = accLiquidity;
    console.log("account liquidity: ", +ethers.utils.formatEther(liq) * 256);
    console.log("account shortfall: ", ethers.utils.formatEther(shortfall));

    // expect(ethers.utils.formatEther(daiBala)).to.equal("30.0");
  });

  // it("Should NOT borrow against savings", async () => {})
  // it("Should payback borrowed amount", async () => {})
  // it("Should NOT payback borrowed amount", async () => {})
  // it("Should create a new account", async () => {})
});
