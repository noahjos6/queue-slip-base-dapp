// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract QueueSlip {
    uint256 public nextTicketId = 1;

    struct Ticket {
        address holder;
        string queueName;
        string note;
        uint256 number;
        uint256 createdAt;
    }

    mapping(uint256 => Ticket) private tickets;
    mapping(bytes32 => uint256) public nextNumberByQueue;

    event TicketClaimed(
        uint256 indexed ticketId,
        address indexed holder,
        string queueName,
        uint256 number,
        string note
    );

    function claimTicket(
        string calldata queueName,
        string calldata note
    ) external returns (uint256 ticketId, uint256 number) {
        require(bytes(queueName).length > 0 && bytes(queueName).length <= 40, "Invalid queue");
        require(bytes(note).length > 0 && bytes(note).length <= 120, "Invalid note");

        bytes32 queueKey = keccak256(bytes(queueName));
        number = nextNumberByQueue[queueKey] + 1;
        nextNumberByQueue[queueKey] = number;

        ticketId = nextTicketId++;
        tickets[ticketId] = Ticket({
            holder: msg.sender,
            queueName: queueName,
            note: note,
            number: number,
            createdAt: block.timestamp
        });

        emit TicketClaimed(ticketId, msg.sender, queueName, number, note);
    }

    function getTicket(
        uint256 ticketId
    )
        external
        view
        returns (
            address holder,
            string memory queueName,
            string memory note,
            uint256 number,
            uint256 createdAt
        )
    {
        Ticket storage entry = tickets[ticketId];
        return (
            entry.holder,
            entry.queueName,
            entry.note,
            entry.number,
            entry.createdAt
        );
    }
}
