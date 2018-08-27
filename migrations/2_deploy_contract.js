var Authorship = artifacts.require("./Authorship.sol");

module.exports = function(deployer) {
  deployer.deploy(Authorship);
};
