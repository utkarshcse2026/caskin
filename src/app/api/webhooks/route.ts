import { db } from "@/db"
import { stripe } from "@/lib/stripe"
import { error } from "console"
import { stat } from "fs"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(req:Request){
        try{
            const body = await req.text()
            const signature = headers().get('stripe-signature')
            if(!signature){
                return new Response('Invalid signature', {status:400})
            }
            const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)

            if(event.type==='checkout.session.completed'){
                if(!event.data.object.customer_details?.email){
                    return new Response('Missing user email')
                }
                const session = event.data.object as Stripe.Checkout.Session
                const {userId,orderID} = session.metadata || {
                    userId:null,
                    orderID:null
                }
                if(!userId || !orderID){
                    return new Response('Missing metadata')
                }
                const billingAddress = session.customer_details!.address
                const shippingAddress = session.shipping_details!.address

                await db.order.update({
                    where:{
                        id:orderID,
                        userId:userId,
                    },
                    data:{
                        isPaid:true,
                        shippingAddress:{
                            create:{
                                name:session.customer_details!.name!,
                                city:shippingAddress!.city!,
                                country:shippingAddress!.country!,
                                postalCode:shippingAddress!.postal_code!,
                                street:shippingAddress!.line1!,
                                state:shippingAddress!.state!,
                            }
                        },
                        billingAddress:{
                            create:{
                                name:session.customer_details!.name!,
                                city:billingAddress!.city!,
                                country:billingAddress!.country!,
                                postalCode:billingAddress!.postal_code!,
                                street:billingAddress!.line1!,
                                state:billingAddress!.state!,
                            }
                        }
                    }
                    })
                }
                return NextResponse.json({result:event, ok:true})
            }
            catch(e){
                console.error(e)
                //we could have used sentry(for enterprised based error tracking) here to log the error 
                //and send it to the team to fix it
                return NextResponse.json(
                    {message:"Something went wrong!"},
                    {status:500}
                )
            }
}