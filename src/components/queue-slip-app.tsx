"use client";

import {
  BadgeCheck,
  Loader2,
  MonitorPlay,
  Search,
  Ticket,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_NOTE_LENGTH,
  MAX_QUEUE_LENGTH,
  queueSlipAbi,
  queueSlipContractAddress,
} from "@/lib/queue-slip";

const PRESETS = [
  { queueName: "Builder Breakfast", note: "One breakfast plate and coffee." },
  { queueName: "Sticker Drop", note: "Collect one sticker pack at the Base table." },
  { queueName: "Demo Desk", note: "Quick five-minute product walkthrough slot." },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid queue")) return "Queue name needs 1 to 40 characters.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 120 characters.";
  return error.message;
}

function padNumber(value?: bigint | number) {
  if (!value) return "000";
  return String(value).padStart(3, "0");
}

function TicketBoard({
  queueName,
  note,
  number,
  holder,
  createdAt,
}: {
  queueName: string;
  note: string;
  number?: bigint;
  holder?: Address;
  createdAt?: bigint;
}) {
  return (
    <article className="board-shell">
      <header className="board-head">
        <div>
          <p>QUEUE SLIP</p>
          <h2>{queueName || "Walk-up queue"}</h2>
        </div>
        <MonitorPlay />
      </header>

      <section className="number-stage">
        <span>Now serving</span>
        <strong>{padNumber(number)}</strong>
      </section>

      <section className="ticket-strip">
        <div>
          <span>Queue note</span>
          <strong>{note || "Claim one spot on Base."}</strong>
        </div>
        <div>
          <span>Wallet</span>
          <strong>{shortAddress(holder)}</strong>
        </div>
        <div>
          <span>Stamped</span>
          <strong>{formatDate(createdAt)}</strong>
        </div>
      </section>
    </article>
  );
}

export function QueueSlipApp() {
  const [ticketIdInput, setTicketIdInput] = useState("1");
  const [queueName, setQueueName] = useState<string>(PRESETS[0].queueName);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [message, setMessage] = useState("Claim a public queue number on Base.");
  const [lastAction, setLastAction] = useState<"claim" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedTicketId = BigInt(Math.max(1, Number(ticketIdInput || "1")));

  const ticketQuery = useReadContract({
    abi: queueSlipAbi,
    address: queueSlipContractAddress,
    functionName: "getTicket",
    args: [parsedTicketId],
    query: { enabled: Boolean(queueSlipContractAddress), refetchInterval: 12000 },
  });

  const totalQuery = useReadContract({
    abi: queueSlipAbi,
    address: queueSlipContractAddress,
    functionName: "nextTicketId",
    query: { enabled: Boolean(queueSlipContractAddress), refetchInterval: 12000 },
  });

  const tuple = ticketQuery.data as
    | readonly [Address, string, string, bigint, bigint]
    | undefined;

  const liveTicket = useMemo(
    () =>
      tuple
        ? {
            holder: tuple[0],
            queueName: tuple[1],
            note: tuple[2],
            number: tuple[3],
            createdAt: tuple[4],
          }
        : undefined,
    [tuple],
  );

  const totalTickets = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    queueName.trim().length > 0 &&
    queueName.trim().length <= MAX_QUEUE_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const claimBlocker = !queueSlipContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_QUEUE_SLIP_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill queue name and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "claim") return;
    void totalQuery.refetch();
    void ticketQuery.refetch();
    const logs = parseEventLogs({ abi: queueSlipAbi, logs: receipt.logs, eventName: "TicketClaimed" });
    const ticketId = logs[0]?.args.ticketId;
    const number = logs[0]?.args.number;
    window.setTimeout(() => {
      if (ticketId) setTicketIdInput(ticketId.toString());
      setMessage(number ? `Ticket ${padNumber(number)} claimed on Base.` : "Queue number claimed on Base.");
    }, 0);
  }, [lastAction, receipt, totalQuery, ticketQuery]);

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, queue) => queue.findIndex((item) => item.id === connector.id) === index);

    if (connectorQueue.length === 0) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Claim your queue spot when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function claimTicket() {
    const contractAddress = queueSlipContractAddress;
    if (claimBlocker) {
      setMessage(claimBlocker);
      return;
    }
    if (!contractAddress) {
      setMessage("Contract not deployed yet. Run npm run deploy:contract first.");
      return;
    }
    try {
      setLastAction("claim");
      setMessage("Confirm the queue claim in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: queueSlipAbi,
        functionName: "claimTicket",
        args: [queueName.trim(), note.trim()],
        chainId: base.id,
      });
      setMessage("Queue claim sent. Waiting for Base confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setQueueName(preset.queueName);
    setNote(preset.note);
  }

  return (
    <main className="queue-shell">
      <section className="queue-panel">
        <header className="queue-head">
          <div>
            <p>QUEUE SLIP</p>
            <h1>Take a number.</h1>
          </div>
          <div className="head-ticket">
            <Ticket />
          </div>
        </header>

        <div className="queue-stats">
          <div>
            <span>Tickets</span>
            <strong>{totalTickets}</strong>
          </div>
          <div>
            <span>Chain</span>
            <strong>Base</strong>
          </div>
        </div>

        <div className="preset-tickets">
          {PRESETS.map((preset, index) => (
            <button key={preset.queueName} onClick={() => applyPreset(index)}>
              <span>{index + 1}</span>
              <div>
                <strong>{preset.queueName}</strong>
                <small>{preset.note}</small>
              </div>
            </button>
          ))}
        </div>

        <label>
          <span>Queue name</span>
          <input value={queueName} onChange={(event) => setQueueName(event.target.value)} maxLength={MAX_QUEUE_LENGTH} />
        </label>

        <label>
          <span>Note</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={MAX_NOTE_LENGTH} rows={3} />
        </label>

        <div className="queue-actions">
          {isConnected && chainId !== base.id ? (
            <button className="claim-button" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>
              {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Switch to Base
            </button>
          ) : (
            <button className="claim-button" disabled={writing || confirming} onClick={claimTicket}>
              {writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
              Claim on Base
            </button>
          )}
          {isConnected ? (
            <button className="wallet-button" onClick={disconnectWallet}>
              {shortAddress(address)}
            </button>
          ) : (
            <button className="wallet-button" disabled={!selectedConnector || connecting} onClick={connectWallet}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              Connect wallet
            </button>
          )}
        </div>

        <p className="queue-status">{message}</p>
        {hash ? (
          <a className="queue-tx" href={`https://basescan.org/tx/${hash}`} rel="noreferrer" target="_blank">
            View transaction on BaseScan
          </a>
        ) : null}
      </section>

      <section className="display-panel">
        <TicketBoard
          queueName={liveTicket?.queueName || queueName}
          note={liveTicket?.note || note}
          number={liveTicket?.number}
          holder={liveTicket?.holder}
          createdAt={liveTicket?.createdAt}
        />

        <div className="display-lower">
          <section className="lookup-panel">
            <div>
              <Search />
              <h2>Load ticket</h2>
            </div>
            <label>
              <span>Ticket ID</span>
              <input value={ticketIdInput} onChange={(event) => setTicketIdInput(event.target.value.replace(/\D/g, ""))} />
            </label>
          </section>

          <section className="about-queue">
            <p>What it does</p>
            <strong>
              Queue Slip lets a wallet claim a public queue number with queue name, note, wallet, and timestamp on Base.
            </strong>
            <div>
              <span><Ticket /> Queue number</span>
              <span><BadgeCheck /> Public record</span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
