import type { Address } from "viem";

export const MAX_QUEUE_LENGTH = 40;
export const MAX_NOTE_LENGTH = 120;

export const queueSlipAbi = [
  {
    type: "event",
    name: "TicketClaimed",
    inputs: [
      { name: "ticketId", type: "uint256", indexed: true },
      { name: "holder", type: "address", indexed: true },
      { name: "queueName", type: "string", indexed: false },
      { name: "number", type: "uint256", indexed: false },
      { name: "note", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "claimTicket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "queueName", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [
      { name: "ticketId", type: "uint256" },
      { name: "number", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getTicket",
    stateMutability: "view",
    inputs: [{ name: "ticketId", type: "uint256" }],
    outputs: [
      { name: "holder", type: "address" },
      { name: "queueName", type: "string" },
      { name: "note", type: "string" },
      { name: "number", type: "uint256" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextTicketId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredQueueSlipContractAddress =
  process.env.NEXT_PUBLIC_QUEUE_SLIP_CONTRACT_ADDRESS?.trim();

export const queueSlipContractAddress = isAddressLike(configuredQueueSlipContractAddress)
  ? (configuredQueueSlipContractAddress as Address)
  : undefined;
