// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRegistry {

    address public superAdmin;
    mapping(address => bool) public admins;

    enum LandStatus { Pending, Approved, Rejected, TransferPending }

    struct LandParcel {
        uint256 id;
        string surveyNumber;
        string location;
        uint256 area;
        string landType;
        address owner;
        address pendingOwner;
        LandStatus status;
        int256 latitude;
        int256 longitude;
        uint256 registeredAt;
        uint256 lastUpdatedAt;
        string documentHash;
        bool exists;
    }

    struct TransferRequest {
        uint256 landId;
        address from;
        address to;
        uint256 requestedAt;
        bool adminApproved;
    }

    // Groups layout parameters into one stack slot to prevent Stack Too Deep errors
    struct LandInput {
        string surveyNumber;
        string location;
        uint256 area;
        string landType;
        int256 latitude;
        int256 longitude;
        string documentHash;
    }

    uint256 private _landCounter;
    mapping(uint256 => LandParcel) public lands;
    mapping(string => bool) public surveyNumberExists;
    mapping(address => uint256[]) public ownerLands;
    mapping(uint256 => TransferRequest) public transferRequests;
    uint256[] public allLandIds;

    event LandRegistered(uint256 indexed id, address indexed owner, string surveyNumber);
    event LandApproved(uint256 indexed id, address indexed admin);
    event LandRejected(uint256 indexed id, address indexed admin, string reason);
    event TransferRequested(uint256 indexed id, address indexed from, address indexed to);
    event TransferApproved(uint256 indexed id, address indexed newOwner);
    event TransferRejected(uint256 indexed id, string reason);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Not super admin");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == superAdmin, "Not an admin");
        _;
    }

    modifier landExists(uint256 _id) {
        require(lands[_id].exists, "Land parcel does not exist");
        _;
    }

    modifier onlyOwner(uint256 _id) {
        require(lands[_id].owner == msg.sender, "Not the land owner");
        _;
    }

    constructor() {
        superAdmin = msg.sender;
        admins[msg.sender] = true;
    }

    function addAdmin(address _admin) external onlySuperAdmin {
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlySuperAdmin {
        require(_admin != superAdmin, "Cannot remove super admin");
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    function registerLand(LandInput calldata input) external returns (uint256) {
        require(bytes(input.surveyNumber).length > 0, "Survey number required");
        require(!surveyNumberExists[input.surveyNumber], "Survey number already registered");
        require(input.area > 0, "Area must be > 0");

        _landCounter++;
        uint256 newId = _landCounter;

        lands[newId] = LandParcel({
            id: newId,
            surveyNumber: input.surveyNumber,
            location: input.location,
            area: input.area,
            landType: input.landType,
            owner: msg.sender,
            pendingOwner: address(0),
            status: LandStatus.Pending,
            latitude: input.latitude,
            longitude: input.longitude,
            registeredAt: block.timestamp,
            lastUpdatedAt: block.timestamp,
            documentHash: input.documentHash,
            exists: true
        });

        surveyNumberExists[input.surveyNumber] = true;
        ownerLands[msg.sender].push(newId);
        allLandIds.push(newId);

        emit LandRegistered(newId, msg.sender, input.surveyNumber);
        return newId;
    }

    function approveLand(uint256 _id) external onlyAdmin landExists(_id) {
        require(lands[_id].status == LandStatus.Pending, "Land is not pending approval");
        lands[_id].status = LandStatus.Approved;
        lands[_id].lastUpdatedAt = block.timestamp;
        emit LandApproved(_id, msg.sender);
    }

    function rejectLand(uint256 _id, string calldata _reason) external onlyAdmin landExists(_id) {
        require(lands[_id].status == LandStatus.Pending, "Land is not pending approval");
        lands[_id].status = LandStatus.Rejected;
        lands[_id].lastUpdatedAt = block.timestamp;
        emit LandRejected(_id, msg.sender, _reason);
    }

    function requestTransfer(uint256 _id, address _newOwner) external landExists(_id) onlyOwner(_id) {
        require(lands[_id].status == LandStatus.Approved, "Land must be approved before transfer");
        require(_newOwner != address(0) && _newOwner != msg.sender, "Invalid new owner");

        lands[_id].status = LandStatus.TransferPending;
        lands[_id].pendingOwner = _newOwner;
        lands[_id].lastUpdatedAt = block.timestamp;

        transferRequests[_id] = TransferRequest({
            landId: _id,
            from: msg.sender,
            to: _newOwner,
            requestedAt: block.timestamp,
            adminApproved: false
        });

        emit TransferRequested(_id, msg.sender, _newOwner);
    }

    function approveTransfer(uint256 _id) external onlyAdmin landExists(_id) {
        require(lands[_id].status == LandStatus.TransferPending, "No transfer pending");

        address oldOwner = lands[_id].owner;
        address newOwner = lands[_id].pendingOwner;

        lands[_id].owner = newOwner;
        lands[_id].pendingOwner = address(0);
        lands[_id].status = LandStatus.Approved;
        lands[_id].lastUpdatedAt = block.timestamp;
        transferRequests[_id].adminApproved = true;

        ownerLands[newOwner].push(_id);
        _removeLandFromOwner(oldOwner, _id);

        emit TransferApproved(_id, newOwner);
    }

    function rejectTransfer(uint256 _id, string calldata _reason) external onlyAdmin landExists(_id) {
        require(lands[_id].status == LandStatus.TransferPending, "No transfer pending");

        lands[_id].status = LandStatus.Approved;
        lands[_id].pendingOwner = address(0);
        lands[_id].lastUpdatedAt = block.timestamp;

        emit TransferRejected(_id, _reason);
    }

    function getLand(uint256 _id) external view landExists(_id) returns (LandParcel memory) {
        return lands[_id];
    }

    function getOwnerLands(address _owner) external view returns (uint256[] memory) {
        return ownerLands[_owner];
    }

    function getAllLands() external view returns (uint256[] memory) {
        return allLandIds;
    }

    function getTotalLands() external view returns (uint256) {
        return _landCounter;
    }

    function isAdmin(address _addr) external view returns (bool) {
        return admins[_addr];
    }

    // Bulletproof swap-and-pop method to dynamically remove land mapping references safely
    function _removeLandFromOwner(address _owner, uint256 _landId) internal {
        uint256[] storage lands_ = ownerLands[_owner];
        uint256 length = lands_.length;
        
        if (length == 0) return;

        for (uint256 i = 0; i < length; i++) {
            if (lands_[i] == _landId) {
                if (i != length - 1) {
                    lands_[i] = lands_[length - 1];
                }
                lands_.pop();
                return;
            }
        }
    }
}