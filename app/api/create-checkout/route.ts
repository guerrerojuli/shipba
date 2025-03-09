import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: 'price_1R0aCwD3sxiLFHCHaeYMiCj2',
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get('origin')}/pricing/success`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      allow_promotion_codes: true,
    });
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session", error);
    return NextResponse.json({ error: "Error creating checkout session" }, { status: 500 });
  }
}
