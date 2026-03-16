import Stripe from "stripe";
import DodoPayments from "dodopayments";
import { db } from "@/server/db";

export async function syncRevenue(productId: string) {
  const config = await db.integrationConfig.findUnique({ where: { productId } });
  if (!config) return { success: false, message: "No integration configured. Add your API key in Settings." };

  try {
    if (config.provider === "STRIPE" && config.stripeApiKey) {
      return await syncStripe(productId, config.stripeApiKey);
    } else if (config.provider === "DODO_PAYMENTS" && config.dodoApiKey) {
      return await syncDodo(productId, config.dodoApiKey);
    }
  } catch (error: any) {
    console.error(`Sync failed for product ${productId}:`, error);
    return { success: false, message: error.message || "Sync failed" };
  }

  return { success: false, message: "API key missing for selected provider" };
}

async function syncStripe(productId: string, apiKey: string) {
  const stripe = new Stripe(apiKey, { apiVersion: "2025-01-27.acacia" as any });

  // Fetch active subscriptions
  const subscriptions = await stripe.subscriptions.list({ status: "active", limit: 100 });

  let totalMrr = 0;
  let activeSubscriptions = 0;
  for (const sub of subscriptions.data) {
    activeSubscriptions++;
    for (const item of sub.items.data) {
      const price = item.price;
      if (price.active && price.unit_amount) {
        let monthly = price.unit_amount;
        if (price.recurring?.interval === "year") monthly = monthly / 12;
        if (price.recurring?.interval === "week") monthly = monthly * 4;
        totalMrr += monthly * (item.quantity || 1);
      }
    }
  }

  const mrr = totalMrr / 100; // cents to dollars

  // Fetch canceled subs (churned) in last 30 days
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;
  const canceledSubs = await stripe.subscriptions.list({
    status: "canceled",
    created: { gte: thirtyDaysAgo },
    limit: 100,
  });

  let churnedMrr = 0;
  for (const sub of canceledSubs.data) {
    for (const item of sub.items.data) {
      if (item.price.unit_amount) {
        let monthly = item.price.unit_amount;
        if (item.price.recurring?.interval === "year") monthly = monthly / 12;
        churnedMrr += monthly * (item.quantity || 1);
      }
    }
  }
  churnedMrr = churnedMrr / 100;

  // Calculate churn rate
  const prevTotal = mrr + churnedMrr;
  const churnRate = prevTotal > 0 ? (churnedMrr / prevTotal) * 100 : 0;

  // Get customer count as users
  const customers = await stripe.customers.list({ limit: 1 });
  const totalUsers = customers.data.length > 0 ? activeSubscriptions : 0;

  // Fetch recent charges for cost tracking (fees)
  const charges = await stripe.charges.list({ limit: 100, created: { gte: thirtyDaysAgo } });
  let totalFees = 0;
  for (const charge of charges.data) {
    if (charge.balance_transaction) {
      // Stripe fees are typically available on balance transactions
      // For simplicity, estimate as ~2.9% + $0.30
      totalFees += (charge.amount * 0.029 + 30) / 100;
    }
  }

  // Auto-import Stripe fees as a cost
  if (totalFees > 0) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    await db.cost.upsert({
      where: { id: `stripe-fees-${productId}-${currentMonth}` },
      update: { amount: Math.round(totalFees * 100) / 100 },
      create: {
        id: `stripe-fees-${productId}-${currentMonth}`,
        productId,
        name: "Stripe Processing Fees",
        category: "PAYMENTS",
        amount: Math.round(totalFees * 100) / 100,
        billingCycle: "monthly",
        vendor: "Stripe",
        month: currentMonth,
        source: "API_STRIPE",
      },
    });
  }

  // New MRR (simplified: difference from last snapshot)
  const lastSnapshot = await db.revenueSnapshot.findFirst({
    where: { productId },
    orderBy: { date: "desc" },
  });
  const newMrr = lastSnapshot ? Math.max(0, mrr - lastSnapshot.mrr + churnedMrr) : mrr;

  // Create snapshot
  const snapshot = await db.revenueSnapshot.create({
    data: {
      productId, mrr, arr: mrr * 12, users: totalUsers,
      activeSubscriptions, newMrr, churnedMrr, churn: churnRate, date: new Date(),
    },
  });

  // Update product
  await db.product.update({
    where: { id: productId },
    data: { mrr, arr: mrr * 12, activeUsers: totalUsers, activeSubscriptions, churnRate, newMrr, churnedMrr },
  });

  await db.integrationConfig.update({ where: { productId }, data: { lastSyncedAt: new Date() } });

  return { success: true, data: snapshot };
}

async function syncDodo(productId: string, apiKey: string) {
  console.log(`[DodoSync] Initializing SDK with key prefix: ${apiKey.substring(0, 10)}...`);

  // The SDK automatically determines the environment from the key
  const client = new DodoPayments({ bearerToken: apiKey });

  let mrr = 0, activeSubscriptions = 0, totalUsers = 0, churnedMrr = 0;

  // Fetch active subscriptions using the SDK
  try {
    const activeSubs: any[] = [];
    for await (const sub of client.subscriptions.list({ status: "active" })) {
      activeSubs.push(sub);
    }
    console.log(`[DodoSync] Found ${activeSubs.length} active subscriptions`);

    for (const sub of activeSubs) {
      activeSubscriptions++;
      const amount = sub.recurring_pre_tax_amount || 0;
      const interval = sub.payment_frequency_interval || "Month";
      const count = sub.payment_frequency_count || 1;
      const quantity = sub.quantity || 1;

      // Normalize to monthly
      let monthlyAmount = amount * quantity;
      if (interval === "Year") monthlyAmount = monthlyAmount / (12 * count);
      else if (interval === "Week") monthlyAmount = (monthlyAmount * 4) / count;
      else if (interval === "Day") monthlyAmount = (monthlyAmount * 30) / count;
      else monthlyAmount = monthlyAmount / count; // Month

      mrr += monthlyAmount / 100; // Convert from smallest currency unit
    }

    // Get unique customers
    const customerIds = new Set(activeSubs.map((s: any) => s.customer?.customer_id).filter(Boolean));
    totalUsers = customerIds.size || activeSubscriptions;
  } catch (e: any) {
    console.error(`[DodoSync] Error fetching active subscriptions:`, e.message || e);
    throw new Error(`DodoPayments error: ${e.message || 'Failed to fetch subscriptions. Check your API key.'}`);
  }

  // Fetch cancelled subscriptions for churn
  try {
    for await (const sub of client.subscriptions.list({ status: "cancelled" })) {
      const amount = sub.recurring_pre_tax_amount || 0;
      const quantity = sub.quantity || 1;
      const interval = sub.payment_frequency_interval || "Month";
      const count = sub.payment_frequency_count || 1;

      let monthlyAmount = amount * quantity;
      if (interval === "Year") monthlyAmount = monthlyAmount / (12 * count);
      else if (interval === "Week") monthlyAmount = (monthlyAmount * 4) / count;
      else if (interval === "Day") monthlyAmount = (monthlyAmount * 30) / count;
      else monthlyAmount = monthlyAmount / count;

      churnedMrr += monthlyAmount / 100;
    }
  } catch (e) {
    console.warn("[DodoSync] Could not fetch cancelled subs for churn:", e);
  }

  const churnRate = (mrr + churnedMrr) > 0 ? (churnedMrr / (mrr + churnedMrr)) * 100 : 0;

  const lastSnapshot = await db.revenueSnapshot.findFirst({
    where: { productId }, orderBy: { date: "desc" },
  });
  const newMrr = lastSnapshot ? Math.max(0, mrr - lastSnapshot.mrr) : mrr;

  const snapshot = await db.revenueSnapshot.create({
    data: {
      productId, mrr, arr: mrr * 12, users: totalUsers,
      activeSubscriptions, newMrr, churnedMrr, churn: churnRate, date: new Date(),
    },
  });

  await db.product.update({
    where: { id: productId },
    data: { mrr, arr: mrr * 12, activeUsers: totalUsers, activeSubscriptions, churnRate, newMrr, churnedMrr },
  });

  await db.integrationConfig.update({ where: { productId }, data: { lastSyncedAt: new Date() } });
 
  // Sync Dodo Fees as costs
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let totalFees = 0;
    // DodoPayments doesn't have a direct "fees" list in the same way, but we can aggregate from payments
    // For now, let's look for payments in the last 30 days and estimate/pull fees
    // In a real production scenario, we'd use the payments.list and look at the fee field if available
    for await (const payment of client.payments.list({ })) {
      const paymentDate = new Date(payment.created_at || "");
      if (paymentDate >= thirtyDaysAgo && payment.status === "succeeded") {
        // DodoPayments typical fee is ~3% + $0.30 or similar. 
        // If the SDK provides the actual fee, we should use it.
        // Assuming amount is in smallest unit
        const amountElement = (payment as any).total_amount || (payment as any).amount || 0;
        totalFees += (amountElement * 0.03 + 30) / 100;
      }
      if (paymentDate < thirtyDaysAgo) break;
    }

    if (totalFees > 0) {
      await db.cost.upsert({
        where: { id: `dodo-fees-${productId}-${currentMonth}` },
        update: { amount: Math.round(totalFees * 100) / 100 },
        create: {
          id: `dodo-fees-${productId}-${currentMonth}`,
          productId,
          name: "DodoPayment Processing Fees",
          category: "PAYMENTS",
          amount: Math.round(totalFees * 100) / 100,
          billingCycle: "monthly",
          vendor: "DodoPayments",
          month: currentMonth,
          source: "API_DODO",
        },
      });
    }
  } catch (e) {
    console.warn("[DodoSync] Could not sync fees:", e);
  }

  console.log(`[DodoSync] Success: MRR=$${mrr}, Subs=${activeSubscriptions}, Users=${totalUsers}`);
  return { success: true, data: snapshot };
}
