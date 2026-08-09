let scriptPromise: Promise<void> | null = null;

/** Loads https://checkout.razorpay.com/v1/checkout.js once, reused across calls. */
function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay checkout — check your connection.'));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

/** Opens the Razorpay Checkout.js modal for a given subscription and resolves on success, rejects on dismiss/failure. */
export async function openRazorpayCheckout(opts: {
  keyId: string;
  subscriptionId: string;
  name: string;
  description: string;
  prefillName: string;
  prefillEmail: string;
}): Promise<RazorpaySuccessResponse> {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: opts.keyId,
      subscription_id: opts.subscriptionId,
      name: opts.name,
      description: opts.description,
      prefill: { name: opts.prefillName, email: opts.prefillEmail },
      theme: { color: '#1F5F4F' },
      handler: (response: RazorpaySuccessResponse) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Checkout was closed before completing payment.')),
      },
    });
    rzp.on('payment.failed', () => reject(new Error('Payment failed. Please try again or use a different method.')));
    rzp.open();
  });
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
