/**
 * Builds the single D1 batch used for an approved payment. Approval at the
 * exact expiration instant is late: only approval strictly before expiry may
 * consume stock.
 */
export function approvedPaymentStatements({orderId,paymentId,eventKey,now,approvedAt}) {
  const statements=[{
    sql:"INSERT OR IGNORE INTO payment_events(provider,event_key,payment_id,order_id,status,created_at) VALUES('mercadopago',?,?,?,?,?)",
    values:[eventKey,paymentId,orderId,"approved",now],
  }];

  if (!approvedAt) {
    statements.push({
      sql:"UPDATE orders SET status='payment_review',payment_status='approved',payment_id=COALESCE(payment_id,?) WHERE id=?",
      values:[paymentId,orderId],
    });
    return statements;
  }

  statements.push(
    {
      sql:"UPDATE inventory_reservations SET status='released',updated_at=? WHERE order_id=? AND status='active' AND expires_at<=?",
      values:[now,orderId,approvedAt],
    },
    {
      sql:"UPDATE inventory_reservations SET status='consumed',updated_at=? WHERE order_id=? AND status='active' AND expires_at>?",
      values:[now,orderId,approvedAt],
    },
    {
      sql:"UPDATE orders SET status='paid',payment_status='approved',payment_id=? WHERE id=? AND (payment_id IS NULL OR payment_id=?) AND EXISTS(SELECT 1 FROM inventory_reservations WHERE order_id=? AND status='consumed')",
      values:[paymentId,orderId,paymentId,orderId],
    },
    {
      sql:"UPDATE orders SET status='payment_review',payment_status='approved' WHERE id=? AND payment_id IS NOT NULL AND payment_id!=?",
      values:[orderId,paymentId],
    },
    {
      sql:"UPDATE orders SET status='payment_review',payment_status='approved',payment_id=COALESCE(payment_id,?) WHERE id=? AND EXISTS(SELECT 1 FROM inventory_reservations WHERE order_id=? AND status='released')",
      values:[paymentId,orderId,orderId],
    },
  );
  return statements;
}

