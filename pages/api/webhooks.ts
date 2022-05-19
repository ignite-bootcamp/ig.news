import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from 'services/stripe';
import { Readable } from 'stream';
import Stripe from 'stripe';
import { saveSubscription } from './_lib/manageSubscriptions';

async function buffer(readable: Readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

const relevantTypes = new Set(['checkout.session.completed']);

export const config = {
  api: {
    bodyParser: false,
  },
};

const webhooks = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const buf = await buffer(req);
  const secret = req.headers['stripe-signature'];

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      secret as string,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error}`);
  }

  const { type } = event;
  if (!relevantTypes.has(type)) {
    return res.status(400).send(`Webhook error: Unknown event type ${type}`);
  }

  try {
    switch (type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        if (!checkoutSession.subscription || !checkoutSession.customer) {
          throw new Error('Webook handler failed');
        }

        await saveSubscription(
          checkoutSession.subscription.toString(),
          checkoutSession.customer.toString(),
        );
        break;
      default:
        throw new Error('Unhandled event.');
    }
  } catch (error) {
    return res.json({ error: `Webhook handler failed` });
  }

  res.json({ received: true });
};

export default webhooks;