export default function EscrowActions({ escrow, role, actions }) {

  if (role === "SME" && escrow.status === "Pending Deposit") {
    return <button onClick={actions.deposit}>Deposit to Escrow</button>;
  }

  if (
    role === "Freelancer" &&
    ["Pending Deposit", "Funded", "In Progress"].includes(escrow.status)
  ) {
    return <button onClick={actions.submit}>Submit Work</button>;
  }

  if (role === "SME" && escrow.status === "Submitted") {
    return (
      <>
        <button onClick={actions.approve}>Approve Work</button>
        <button onClick={actions.reject}>Reject</button>
      </>
    );
  }

  return null;
}
