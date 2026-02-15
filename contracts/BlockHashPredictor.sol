// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BlockHashPredictor
 * @notice Users predict the next block's hash. Predictions are stored on-chain
 *         and can be verified once the target block is mined.
 */
contract BlockHashPredictor {

    struct Prediction {
        address predictor;
        uint256 targetBlock;      // block number they are predicting
        bytes32 predictedHash;    // their predicted hash
        bytes32 actualHash;       // filled in after reveal
        bool    revealed;         // whether the result has been revealed
        bool    correct;          // whether the prediction was correct
        uint256 timestamp;        // when the prediction was submitted
    }

    // All predictions ever made
    Prediction[] public predictions;

    // Quick lookup: user address -> their prediction IDs
    mapping(address => uint256[]) public userPredictions;

    // Latest block hash snapshot (convenience cache updated on every tx)
    bytes32 public latestStoredHash;
    uint256 public latestStoredBlockNumber;

    // ── Events ──────────────────────────────────────────────────────────
    event PredictionSubmitted(
        uint256 indexed predictionId,
        address indexed predictor,
        uint256 targetBlock,
        bytes32 predictedHash
    );

    event PredictionRevealed(
        uint256 indexed predictionId,
        address indexed predictor,
        bytes32 actualHash,
        bool    correct
    );

    // ── Core Functions ──────────────────────────────────────────────────

    /**
     * @notice Submit a prediction for the NEXT block's hash.
     * @param _predictedHash  The hash you think the next block will have.
     *                        Pass bytes32(0) to use one of the preset options
     *                        generated off-chain.
     */
    function submitPrediction(bytes32 _predictedHash) external returns (uint256 predictionId) {
        // snapshot current chain tip
        _snapshotLatest();

        uint256 targetBlock = block.number + 1;

        predictionId = predictions.length;
        predictions.push(Prediction({
            predictor:     msg.sender,
            targetBlock:   targetBlock,
            predictedHash: _predictedHash,
            actualHash:    bytes32(0),
            revealed:      false,
            correct:       false,
            timestamp:     block.timestamp
        }));

        userPredictions[msg.sender].push(predictionId);

        emit PredictionSubmitted(predictionId, msg.sender, targetBlock, _predictedHash);
    }

    /**
     * @notice Reveal the actual hash for a prior prediction.
     *         Can be called by anyone once the target block is mined
     *         (and within 256 blocks – EVM limitation).
     */
    function revealPrediction(uint256 _predictionId) external {
        require(_predictionId < predictions.length, "Invalid ID");
        Prediction storage p = predictions[_predictionId];
        require(!p.revealed, "Already revealed");
        require(block.number > p.targetBlock, "Target block not yet mined");
        require(
            block.number - p.targetBlock <= 256,
            "Too late - blockhash no longer available (>256 blocks)"
        );

        bytes32 actual = blockhash(p.targetBlock);
        require(actual != bytes32(0), "Blockhash unavailable");

        p.actualHash = actual;
        p.revealed   = true;
        p.correct    = (actual == p.predictedHash);

        // also refresh the snapshot
        _snapshotLatest();

        emit PredictionRevealed(_predictionId, p.predictor, actual, p.correct);
    }

    // ── View Helpers ────────────────────────────────────────────────────

    /// @notice Return the current block number (convenience for front-end)
    function currentBlockNumber() external view returns (uint256) {
        return block.number;
    }

    /// @notice Return the hash of a recent block (within 256 blocks)
    function getBlockHash(uint256 _blockNumber) external view returns (bytes32) {
        require(_blockNumber < block.number, "Block not mined yet");
        return blockhash(_blockNumber);
    }

    /// @notice Total number of predictions stored
    function totalPredictions() external view returns (uint256) {
        return predictions.length;
    }

    /// @notice All prediction IDs for a given user
    function getUserPredictions(address _user) external view returns (uint256[] memory) {
        return userPredictions[_user];
    }

    /// @notice Get full prediction details
    function getPrediction(uint256 _id)
        external
        view
        returns (
            address predictor,
            uint256 targetBlock,
            bytes32 predictedHash,
            bytes32 actualHash,
            bool    revealed,
            bool    correct,
            uint256 timestamp
        )
    {
        require(_id < predictions.length, "Invalid ID");
        Prediction storage p = predictions[_id];
        return (
            p.predictor,
            p.targetBlock,
            p.predictedHash,
            p.actualHash,
            p.revealed,
            p.correct,
            p.timestamp
        );
    }

    // ── Internal ────────────────────────────────────────────────────────

    function _snapshotLatest() internal {
        if (block.number > 0) {
            latestStoredBlockNumber = block.number - 1;
            latestStoredHash = blockhash(block.number - 1);
        }
    }
}
