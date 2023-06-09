const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const VRF_SUB_AMOUNT = ethers.utils.parseEther("2");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let VRFCoordinatorV2Address, subscriptionId, VRFCoordinatorV2Mock;

  if (developmentChains.includes(network.name)) {
    VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    VRFCoordinatorV2Address = VRFCoordinatorV2Mock.address;
    const transactionResponse = await VRFCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;
    await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_AMOUNT);

    //adding consumer

    log("Consumer is added");
  } else {
    VRFCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  log(
    "-----------------------Raffle contract deploying-----------------------------"
  );

  const entranceFee = networkConfig[chainId]["entranceFee"];
  const gasLane = networkConfig[chainId]["gasLane"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
  const interval = networkConfig[chainId]["interval"];
  //const interval = "30";

  const args = [
    VRFCoordinatorV2Address,
    subscriptionId,
    gasLane,
    interval,
    entranceFee,
    callbackGasLimit,
  ];

  console.log(args);
  console.log(deployer);

  const raffle = await deploy("Raffle", {
    from: deployer,
    args: args,
    logs: true,
    waitConfirmations: 6,
  });

  console.log("contract Address : ", raffle.address);

  if (developmentChains.includes(network.name)) {
    await VRFCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address);

    log("Consumer is added");
  }

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("verifying......");
    await verify(raffle.address, args);
  }

  log("..............................................................");
};

module.exports.tags = ["all", "raffle"];
