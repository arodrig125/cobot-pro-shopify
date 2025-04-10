/app.post("/api/billing/subscribe", async (req, res) => {
  try {
    const { shop } = req.body;
    if (!shop) {
      throw new Error("Shop is required");
    }

    const session = res.locals.shopify.session;
    if (!session) {
      throw new Error("Shopify session is missing");
    }

    const client = new shopify.clients.Rest({
      session,
    });

    const response = await client.post({
      path: "recurring_application_charges",
      data: {how do thes
        recurring_application_charge: {
          name: "Pro Plan",
          price: 9.99,
          return_url: `${process.env.HOST}/billing/callback`,
          test: process.env.NODE_ENV !== "production",
        },
      },
      type: "application/json",
    });

    res.status(200).send({ success: true, confirmationUrl: response.body.recurring_application_charge.confirmation_url });
  } catch (error) {
    console.error("Billing subscription failed:", error);
    res.status(500).send({ success: false, error: error.message });
  }
});