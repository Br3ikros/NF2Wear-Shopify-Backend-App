# NF2Wear-Shopify-Backend-App
The backend app for the website https://nf2wear.com.

What it does:
I integrated a Metamask login on the product pages of the website.
When the user Connects their wallet to the website, a public address is returned
The frontend communicates with the backend App.
The backend app with the public address returns a list of NFTs related to that address.
Once the user selects and NFT, the backend app is sent that NFT, produces a QR Code sending a request to another API and sends back the QR Code to the frontend.
The user adds the product (sweatshirt or tshirt) to the cart.
Once the purchase is made, the backend is registered through a webhook to a "order" event. When the event is triggered, the backend receives the order details.
To make sure the events are coming from the right source HMAC is used.
The backend uses an AI Image Upscaler API from DeepAI to enhance the resolution of the NFT before it gets printed on a tshirt.
The backend manipulates the NFT image with Sharp (a Node.js image processing library) and composites it with another transparent file that is required by the Printful API (print on demand service).
The backend sends a request to the Printful API for the shirt to be produced.
The owner of the shop (me) has to go to printful, pay for the shirt and it will then be automatically sent to the customer.

Disclaimer: I stopped paying for the QR Code API as I wasn't making any sales (no budget for marketing) and so you won't be allowed to add any items to the cart.
