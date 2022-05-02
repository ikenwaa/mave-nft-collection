// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract MaveNFTs is ERC721Enumerable, Ownable {
    string _baseTokenURI;

    // _price is the price of one Mave Dev NFT
    uint256 public _price = 0.01 ether;

    // _paused is used to pause the contract in case of an emergency
    bool public _paused;

    // Max number of MaveNFTs
    uint256 public maxTokenIds = 20;

    // total number of tokenIds minted
    uint256 public tokenIds;

    // Instantiate IWhitelist.sol contract
    IWhitelist whitelist;

    // Track if presale has started or not
    bool public presaleStarted;

    // Time when presale will end
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract is currently paused.");
        _;
    }

    /**
    Create an ERC721 constructor that takes "Mave Devs", "MD" as parameters.
    */
    constructor (string memory baseURI, address whitelistContract) ERC721("Mave Devs", "MD"){
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    // start pre sale for whitelisted addresses
    function startPresale() public onlyOwner {
        presaleStarted = true;
        //  set presaleEnded time as current timestamp + 5 minutes.
        presaleEnded = block.timestamp + 5 minutes;
    }

    // presaleMint allows a user to mint one NFT per transaction during presale
    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Pre sale is currently not running.");
        require(whitelist.whitelistedAddresses(msg.sender), "You are not on the whitelist.");
        require(tokenIds < maxTokenIds, "Exceeded maximum Mave NFTs supply.");
        require(msg.value >= _price, "Ether sent is not currect.");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    // mint() allows a user to mint 1 NFT per transaction after the pre sale has ended.
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >=  presaleEnded, "Presale has not ended yet.");
        require(tokenIds < maxTokenIds, "Exceed maximum Mave NFTs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    // _baseURI overides the OpenZeppelin's ERC721 implementation which by 
    //  default returns an empty string for the baseURI.
    function _baseURI() internal view virtual override returns (string memory){
        return _baseTokenURI;
    }

    // setPaused sets the contract too paused or unpaused.
    function setPaused(bool val) public onlyOwner{
        _paused = val;
    }

    // withdraw() sends all the ether in the contract to the owner of the contract.
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether.");
    }

    // Function to receive Ether.msg.data must be empty
    receive() external payable {}

    //  Fallback function is called when msg.data is not empty
    fallback() external payable {}
}