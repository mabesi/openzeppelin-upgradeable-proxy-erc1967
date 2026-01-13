import { loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("OZMultiToken", function () {
  
  async function deployFixture() {
    
    const [owner, user] = await ethers.getSigners();
    const OZMultiToken = await ethers.getContractFactory("OZMultiToken");
    const cc = await upgrades.deployProxy(OZMultiToken);

    return { cc, owner, user };
  }
    
  it("Should mint", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    const balance = await cc.balanceOf(owner.address, 0);
    const supply = await cc.totalSupply(0);

    expect(balance).to.equal(1, "Cannot mint (balance)");
    expect(supply).to.equal(1, "Cannot mint (supply)");
  });

  it("Should NOT mint (not exists)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);
    await expect(cc.mint(3, { value: ethers.parseEther("0.01")})).to.be.revertedWith("This token does not exists");
  });
  
  it("Should NOT mint (payment)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);
    await expect(cc.mint(0, { value: ethers.parseEther("0.001")})).to.be.revertedWith("Insufficient payment");
  });

  it("Should NOT mint (supply)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    for (let i=0; i < 50; i++)
      await cc.mint(0, { value: ethers.parseEther("0.01")});

    await expect(cc.mint(0, { value: ethers.parseEther("0.01")})).to.be.revertedWith("Max supply reached");
  });
    
  it("Should burn", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    await cc.burn(owner.address, 0, 1);
    const balance = await cc.balanceOf(owner.address, 0);
    const supply = await cc.totalSupply(0);

    expect(balance).to.equal(0, "Cannot burn (balance)");
    expect(supply).to.equal(0, "Cannot burn (supply)");
  });

  it("Should burn (approved)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    await cc.setApprovalForAll(user.address, true);
    const approved = await cc.isApprovedForAll(owner.address, user.address);

    const instance = cc.connect(user);
    await instance.burn(owner.address, 0, 1);

    const balance = await cc.balanceOf(owner.address, 0);
    const supply = await cc.totalSupply(0);

    expect(balance).to.equal(0, "Cannot burn (approved)(balance)");
    expect(supply).to.equal(0, "Cannot burn (approved)(supply)");
    expect(approved).to.equal(true, "Cannot burn (approved)(approved)");
  });

  it("Should NOT burn (balance)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);
    await expect(cc.burn(owner.address, 0, 1)).to.be.revertedWith("ERC1155: burn amount exceeds totalSupply");
  });

  it("Should NOT burn (permission)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    const instance = cc.connect(user);

    await expect(instance.burn(owner.address, 0, 1)).to.be.revertedWith("ERC1155: caller is not token owner or approved");
  });
    
  it("Should safeTransferFrom", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    await cc.safeTransferFrom(owner.address, user.address, 0, 1, "0x00000000");
    
    const balances = await cc.balanceOfBatch([owner.address, user.address], [0,0]);
    const supply = await cc.totalSupply(0);

    expect(balances[0]).to.equal(0, "Cannot safe transfer (owner)");
    expect(balances[1]).to.equal(1, "Cannot safe transfer (user)");
    expect(supply).to.equal(1, "Cannot safe transfer (supply)");
  });

  it("Should emit transfer event", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    
    await expect(cc.safeTransferFrom(owner.address, user.address, 0, 1, "0x00000000"))
                .to.emit(cc, "TransferSingle")
                .withArgs(owner.address, owner.address, user.address, 0, 1);
  });

  it("Should safeBatchTransferFrom", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    await cc.mint(1, { value: ethers.parseEther("0.01")});
    await cc.safeBatchTransferFrom(owner.address, user.address, [0,1], [1,1], "0x00000000");
    
    const balances = await cc.balanceOfBatch([owner.address, owner.address, user.address, user.address], [0,1,0,1]);
    const supply0 = await cc.totalSupply(0);
    const supply1 = await cc.totalSupply(1);

    expect(balances[0]).to.equal(0, "Cannot safe transfer (owner 0)");
    expect(balances[1]).to.equal(0, "Cannot safe transfer (owner 1)");
    expect(balances[2]).to.equal(1, "Cannot safe transfer (user 0)");
    expect(balances[3]).to.equal(1, "Cannot safe transfer (user 1)");
    expect(supply0).to.equal(1, "Cannot safe transfer (supply)");
    expect(supply1).to.equal(1, "Cannot safe transfer (supply)");
  });

  it("Should emit batch transfer event", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    await cc.mint(1, { value: ethers.parseEther("0.01")});
    
    await expect(cc.safeBatchTransferFrom(owner.address, user.address, [0,1], [1,1], "0x00000000"))
                .to.emit(cc, "TransferBatch")
                .withArgs(owner.address, owner.address, user.address, [0,1], [1,1]);
  });  

  it("Should safeTransferFrom (approved)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});

    await cc.setApprovalForAll(user.address, true);

    const instance = cc.connect(user);
    await instance.safeTransferFrom(owner.address, user.address, 0, 1, "0x00000000");
    
    const balances = await cc.balanceOfBatch([owner.address, user.address], [0,0]);
    const supply = await cc.totalSupply(0);

    expect(balances[0]).to.equal(0, "Cannot safe transfer (approved)(owner)");
    expect(balances[1]).to.equal(1, "Cannot safe transfer (approved)(user)");
    expect(supply).to.equal(1, "Cannot safe transfer (approved)(supply)");
  });
  
  it("Should emit approval event", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await expect(cc.setApprovalForAll(user.address, true))
                .to.emit(cc, "ApprovalForAll")
                .withArgs(owner.address, user.address, true);
  });

  it("Should NOT safeTransferFrom (balance)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await expect(cc.safeTransferFrom(owner.address, user.address, 0, 1, "0x00000000"))
                .to.be.revertedWith("ERC1155: insufficient balance for transfer");
  });

  it("Should NOT safeTransferFrom (not exists)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await expect(cc.safeTransferFrom(owner.address, user.address, 3, 1, "0x00000000"))
                .to.be.revertedWith("ERC1155: insufficient balance for transfer");
  });

  it("Should NOT safeTransferFrom (permission)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    const instance = cc.connect(user);

    await expect(instance.safeTransferFrom(owner.address, user.address, 0, 1, "0x00000000"))
                .to.be.revertedWith("ERC1155: caller is not token owner or approved");
  });

  it("Should NOT safeBatchTransferFrom (array mismatch)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    await cc.mint(1, { value: ethers.parseEther("0.01")});

    await expect(cc.safeBatchTransferFrom(owner.address, user.address, [0,1], [1], "0x00000000"))
                .to.be.revertedWith("ERC1155: ids and amounts length mismatch");
  });

  it("Should NOT safeBatchTransferFrom (permission)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    await cc.mint(1, { value: ethers.parseEther("0.01")});
    const instance = cc.connect(user);

    await expect(instance.safeBatchTransferFrom(owner.address, user.address, [0,1], [1,1], "0x00000000"))
                .to.be.revertedWith("ERC1155: caller is not token owner or approved");
  });

  it("Should supports interface", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    const support = await cc.supportsInterface("0xd9b67a26");

    expect(support).to.equal(true, "Does not support interface ERC-1155");
  });

  it("Should withdraw", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    const instance = cc.connect(user);
    await instance.mint(0, { value: ethers.parseEther("0.01")});

    const ccBalanceBefore = await ethers.provider.getBalance(cc.getAddress());
    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    await cc.withdraw();

    const ccBalanceAfter = await ethers.provider.getBalance(cc.getAddress());
    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

    expect(ccBalanceBefore).to.equal(ethers.parseEther("0.01"), "Cannot withdraw");
    expect(ccBalanceAfter).to.equal(0, "Cannot withdraw");
    expect(ownerBalanceAfter).to.greaterThan(ownerBalanceBefore, "Cannot withdraw");
  });

  it("Should NOT withdraw (permission)", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    const instance = cc.connect(user);

    await expect(instance.withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should has URI metadata", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await cc.mint(0, { value: ethers.parseEther("0.01")});
    const uri = await cc.uri(0);
    
    expect(uri).to.equal("ipfs://mybaseurladdress/0.json", "Does not have URI");
  });

  it("Should NOT has URI metadata", async function () {
    const { cc, owner, user } = await loadFixture(deployFixture);

    await expect(cc.uri(10)).to.be.revertedWith("This token does not exists");
  });

});