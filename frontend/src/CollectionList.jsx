function CollectionList({ collection, onUpdateQuantity, onRemove }) {
  if (collection.length === 0) {
    return (
      <div style={{ marginTop: "2rem" }}>
        <h2>My Collection</h2>
        <p>No cards yet — search above and add some.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>My Collection ({collection.length})</h2>
      <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: "600px" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th style={{ padding: "0.4rem" }}>Card</th>
            <th style={{ padding: "0.4rem" }}>Game</th>
            <th style={{ padding: "0.4rem" }}>Qty</th>
            <th style={{ padding: "0.4rem" }}>Condition</th>
            <th style={{ padding: "0.4rem" }}>Foil</th>
            <th style={{ padding: "0.4rem" }}></th>
          </tr>
        </thead>
        <tbody>
          {collection.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.4rem" }}>{item.card_name}</td>
              <td style={{ padding: "0.4rem" }}>{item.game}</td>
              <td style={{ padding: "0.4rem" }}>
                <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                  −
                </button>{" "}
                {item.quantity}{" "}
                <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
              </td>
              <td style={{ padding: "0.4rem" }}>{item.condition}</td>
              <td style={{ padding: "0.4rem" }}>{item.is_foil ? "Yes" : "No"}</td>
              <td style={{ padding: "0.4rem" }}>
                <button onClick={() => onRemove(item.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CollectionList;