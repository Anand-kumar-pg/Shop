
import Stripe from "stripe";
import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import Order from "../models/order.js";

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create stripe checkout session => /api/v1/payment/checkout_session
export const stripeCheckOutSession = catchAsyncErrors(async (req, res, next) => {
    const body = req.body;
    const line_items = body.orderItems.map((item) => {
        return {
            price_data: {
                currency: "inr",
                product_data: {
                    name: item.name,
                    images: [item.image],
                    metadata: { productId: item.product },
                },
                unit_amount: item.price * 100 
            },
            quantity: item.quantity,
        };
    });

    const shippingInfo = body.shippingInfo;
    const shipping_rate = body.itemsPrice >= 200 ? "shr_1OyTZCSCLfJP4NkmmwezPUE8" : "shr_1OyTbJSCLfJP4NkmBLnQmxjE";

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${process.env.FRONTEND_URL}/me/orders?order_success=true`,
        cancel_url: `${process.env.FRONTEND_URL}`,
        customer_email: req.user.email,
        client_reference_id: req.user._id.toString(),
        mode: 'payment',
        metadata: { ...shippingInfo, itemsPrice: body.itemsPrice },
        shipping_options: [{
            shipping_rate,
        }],
        line_items,
    });

    res.status(200).json({
        url: session.url,
    });
});

// Create new order after payment => /api/v1/payment/webhook
export const stripeWebhook = catchAsyncErrors(async (req, res, next) => {
    try {
        const signature = req.headers["stripe-signature"];
        const event = stripe.webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const line_items = await stripe.checkout.sessions.listLineItems(session.id); // Corrected function name
            const orderItems = await getOrderItems(line_items);
            const user = session.client_reference_id;
            const totalAmount = session.amount_total / 100;
            const taxAmount = session.total_details.amount_tax / 100;
            const shippingAmount = session.total_details.amount_shipping / 100;
            const itemsPrice = session.metadata.itemsPrice;

            const shippingInfo = {
                address: session.metadata.address,
                city: session.metadata.city,
                phoneNo: session.metadata.phoneNo,
                zipCode: session.metadata.zipCode,
                country: session.metadata.country,
            };

            const paymentInfo = {
                id: session.payment_intent,
                status: session.payment_status,
            };
            
            const orderData = {
                shippingInfo,
                orderItems,
                itemsPrice,
                taxAmount,
                shippingAmount,
                totalAmount,
                paymentInfo,
                paymentMethod: "Card",
                user,
            };

            const createdOrder = await Order.create(orderData); // Create the order
            res.status(200).json({ success: true, order: createdOrder });
        }
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, message: "Webhook processing failed" });
    }
});

// Helper function to retrieve order items
const getOrderItems = async (line_items) => {
    return Promise.all(line_items.data.map(async (item) => {
        const product = await stripe.products.retrieve(item.price.product);
        const productId = product.metadata.productId;

        return {
            product: productId,
            name: product.name,
            price: item.price.unit_amount_decimal / 100, 
            quantity: item.quantity,
            image: product.images[0]
        };
    }));
};

