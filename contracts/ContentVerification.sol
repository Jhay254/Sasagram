// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ContentVerification
 * @dev Smart contract for immutable content verification on Polygon
 * @notice Stores content hashes with timestamps for public verification
 */
contract ContentVerification {
    struct ContentRecord {
        bytes32 contentHash;
        address creator;
        uint256 timestamp;
        string contentType;
        bool exists;
    }
    
    // Mapping from content hash to verification record
    mapping(bytes32 => ContentRecord) public verifiedContent;
    
    // Total number of verified items
    uint256 public totalVerifications;
    
    // Events
    event ContentVerified(
        bytes32 indexed contentHash,
        address indexed creator,
        uint256 timestamp,
        string contentType
    );
    
    /**
     * @dev Verify new content on the blockchain
     * @param _contentHash SHA-256 hash of the content
     * @param _contentType Type of content (BIOGRAPHY, CHAPTER, PHOTO, VIDEO)
     * @return success Whether verification was successful
     */
    function verifyContent(
        bytes32 _contentHash,
        string memory _contentType
    ) public returns (bool success) {
        require(!verifiedContent[_contentHash].exists, "Content already verified");
        require(bytes(_contentType).length > 0, "Content type required");
        
        verifiedContent[_contentHash] = ContentRecord({
            contentHash: _contentHash,
            creator: msg.sender,
            timestamp: block.timestamp,
            contentType: _contentType,
            exists: true
        });
        
        totalVerifications++;
        
        emit ContentVerified(_contentHash, msg.sender, block.timestamp, _contentType);
        
        return true;
    }
    
    /**
     * @dev Get content verification record
     * @param _contentHash Hash to look up
     * @return creator Address of the content creator
     * @return timestamp When the content was verified
     * @return contentType Type of content
     * @return exists Whether the record exists
     */
    function getContentRecord(bytes32 _contentHash) 
        public 
        view 
        returns (
            address creator,
            uint256 timestamp,
            string memory contentType,
            bool exists
        ) 
    {
        ContentRecord memory record = verifiedContent[_contentHash];
        return (
            record.creator,
            record.timestamp,
            record.contentType,
            record.exists
        );
    }
    
    /**
     * @dev Check if content hash is verified
     * @param _contentHash Hash to check
     * @return verified Whether content is verified
     */
    function isVerified(bytes32 _contentHash) public view returns (bool verified) {
        return verifiedContent[_contentHash].exists;
    }
    
    /**
     * @dev Get total number of verifications
     * @return total Total verifications on contract
     */
    function getTotalVerifications() public view returns (uint256 total) {
        return totalVerifications;
    }
}
