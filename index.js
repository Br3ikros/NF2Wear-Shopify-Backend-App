//cmd /k ngrok http 3000
//global.gc()
'use strict';

var process = require('process')
const Shopify = require('@shopify/shopify-api').Shopify
const express = require('express')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const fetch = require('node-fetch')
const url = require('url')
const crypto = require('crypto')

const axios = require("axios").default;
const { PassThrough } = require("stream");
const FormData = require('form-data');

const sharp = require('sharp');
sharp.cache(false);

var deepai = require("deepai")
deepai.setApiKey('');

const LINQR_RAPIDAPI_KEY = "";
const IMG_BB_KEY = '';


//database to write failed orders initialisation
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
let db;

try{
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      db = admin.firestore();
}catch(error){
    console.log("Failed to initialize FireStore database")
}

//

const sweatshirt_data = require("./products.json")
const tshirt_data = require("./tshirt.json")

let sweatshirt_mockups = {
    "mockups": [
        {
            "color": "White",
            "link": "https://cdn.shopify.com/s/files/1/0605/4251/7430/products/unisex-crew-neck-sweatshirt-white-front-623ed75e736a9_720x.jpg?v=1648285548"
        },
        {
            "color": "Black",
            "link": "https://cdn.shopify.com/s/files/1/0605/4251/7430/products/unisex-crew-neck-sweatshirt-black-front-623ed75e77545_720x.jpg?v=1648285549"
        },
        {
            "color": "Maroon",
            "link": "https://cdn.shopify.com/s/files/1/0605/4251/7430/products/unisex-crew-neck-sweatshirt-maroon-front-623ed75e78e12_590x.jpg?v=1648285553"
        },
        {
            "color": "Light Pink",
            "link": "https://cdn.shopify.com/s/files/1/0605/4251/7430/products/unisex-crew-neck-sweatshirt-light-pink-front-623ed75e89afd_590x.jpg?v=1648285564"
        },
        {
            "color": "Red",
            "link": "https://cdn.shopify.com/s/files/1/0605/4251/7430/products/unisex-crew-neck-sweatshirt-red-front-623ed75e7a003_590x.jpg?v=1648285554"
        },
        {
            "color": "Navy",
            "link": "https://cdn.shopify.com/s/files/1/0605/4251/7430/products/unisex-crew-neck-sweatshirt-navy-front-623ed75e77a94_720x.jpg?v=1648285551"
        },
        {
            "color": "Indigo Blue",
            "link": "https://cdn.shopify.com/s/files/1/0605/4251/7430/products/unisex-crew-neck-sweatshirt-indigo-blue-front-623ed75e80862_590x.jpg?v=1648285558"
        },
        {
            "color": "Light Blue",
            "link": "https://cdn.shopify.com/s/files/1/0605/4251/7430/products/unisex-crew-neck-sweatshirt-light-blue-front-623ed75e83e7f_590x.jpg?v=1648285560"
        },
        {
            "color": "Dark Heather",
            "link": "https://cdn.shopify.com/s/files/1/0605/4251/7430/products/unisex-crew-neck-sweatshirt-dark-heather-front-623ed75e7b57d_720x.jpg?v=1648285556"
        },
        {
            "color": "Sport Grey",
            "link": "https://cdn.shopify.com/s/files/1/0605/4251/7430/products/unisex-crew-neck-sweatshirt-sport-grey-front-623ed75e869fd_590x.jpg?v=1648285562"
        }
    ]
};
let tshirt_mockups = require("./tshirt_mockups.json")

let order_template = {
    "recipient": {
        "name": "John Doe",
        "address1": "19749 Dearborn St",
        "address2": "",
        "city": "Chatsworth",
        "state_code": "CA",
        "country_code": "US",
        "zip": "91311"
    },
    "items": [
        {
            "variant_id": 5426,
            "quantity": 1,
            "files": [
                {
                    "type": "front",
                    "url": "https://lh3.googleusercontent.com/4rIhhfLWqB3qUi-BMkXlyMnylwztk-HfOUQhtsmPBtfJKLh2FPNPMgL3YL6Jg0JMopsMcjaevYjXYw8lR9vFRfrZ2rsV7JXPo6mRVws"
                },
                {
                    "type": "sleeve_right",
                    "url": "https://ratdao.mypinata.cloud/ipfs/QmeuDBnJvb2xxwnQf9Dpwr6CV3Y3hbXC6UNmoxHtBZS43Z"
                },
                {
                    "type": "mockup"
                }

            ]
        }
    ],
    "packing_slip": {
        "email": "john.doe@printful.com",
        "phone": "288-888-8888",
        "message": "Custom packing slip",
        "logo_url": "https://i.ibb.co/LCGjNZP/Modern-Letter-W-Wild-Stell-Logo-11.png"
    }
}




let jsonParser = bodyParser.json()

dotenv.config()

const host = "127.0.0.1"
const port = 3000

const app = express()

app.use('/order', bodyParser.json({verify:function(req,res,buf){req.rawBody=buf.toString()}}))
app.use(jsonParser)

app.get('/qr', async (req, res) => {

    let nftImgSrc = req.query.link
    let linqr_response = await axios.post(
        'https://qrcode3.p.rapidapi.com/qrcode/text',
        {
            data: nftImgSrc,
            image: {
                /**
                 * Instead of downloading an image from external server every time, 
                 * consider to use LinQR storage to speedup requests
                 */
                uri: 'https://cdn.shopify.com/s/files/1/0605/4251/7430/products/15_720x.png?v=1648225331',
                modules: false
            },
            style: {
                module: { color: 'black', shape: "lightround" },
                inner_eye: { color: 'black', shape: "lightround" },
                outer_eye: { color: 'black', shape: "lightround" },
                background: {
                    color: "#ffffff"
                }
            },
            size: { width: 600, "quiet_zone": 4 },
            output: { format: 'png' }
        },
        {
            headers: { 'x-rapidapi-key': LINQR_RAPIDAPI_KEY },
            responseType: 'stream'
        }
    );

    const chunks = linqr_response.data
        .pipe(new PassThrough({ encoding: 'base64' }));

    // // then we use an async generator to read the chunks
    let qrLink = '';
    for await (let chunk of chunks) {
        qrLink += chunk;
    }

    qrLink = "data:image/png;base64, " + qrLink;
    //console.log(qrLink)


    res.json({ qr: qrLink })
    // res.send("[accepted]")
})

app.get('/wallet', async (req, res) => {
    let walletAddress = req.query.address;
    let chain = req.query.chain;

    const response = await fetch('https://deep-index.moralis.io/api/v2/' + walletAddress + '/nft?chain=' + chain + '&format=decimal', {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'X-API-Key': ''
        }
    });

    const nftsOwned = await response.json(); //extract JSON require(the http response
    //console.log(nftsOwned)
    res.json(nftsOwned)

})

app.post('/order', async (req, res) => {
    // console.log(req.headers['x-shopify-hmac-sha256']);
    // console.log(req.body.shipping_address)
    // console.log(req.body.line_items[0].title)
    // //returns a string in the form Red / XL
    // console.log(req.body.line_items[0].variant_title)
    // console.log(req.body.line_items[0].properties)
    // console.log(req.body.line_items[0].quantity)

    console.log(req.body.order_number)

    if (verify_webhook(req)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }

    //this is the dirtiest and most horrifying way of resending an order to printful if the previous attempt failed
    //which happens because some images stored on ipfs take too long to load sometimes
    //I could have used a while loop but not knowing yet the mechanics of async-await i didn't want
    //to risk blocking the event loop with a while loop, although i'm pretty certain it wouldn't have.
    //so for now i try to send an order, if it fails i try again, and once more, using if and else statements
    if(await makeOrder(req.body)) {
        console.log("Order n " + req.body.order_number + " SUCCESSFUL!")
    } else {
        console.log("Order failed. Retrying...")
        await delay(120000)

        if(await makeOrder(req.body)){
            console.log("Order n " + req.body.order_number + " SUCCESSFUL!")
        } else {
            console.log("Order failed. Retrying...")
            await delay(120000)

            if(await makeOrder(req.body)){
                console.log("Order n " + req.body.order_number + " SUCCESSFUL!")
            } else {
                console.log("Order n " + req.body.order_number + " FAILED!")
                
        
                let failed_order = {
                    order: req.body.order_number
                }

                try{
                    db.collection("failedOrders").add(failed_order).then(() => {
                        console.log("Failed order added to database");
                      })
                      
                }catch(err){
                    console.log("Failed: could not write failed order to database")
                }



            }

        }
    }

    console.log("end")
    console.log(process.memoryUsage())

})


const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function makeOrder(body){

    let order;
 
    try{
        order = getOrderTemplate(body.shipping_address)
 
        for (const index in body.line_items) {
            order.items.push(await getItemTemplate(body.line_items[index]))
        }
        await sendOrderToPrintful(order)

        return true

    } catch(err){
        return false
    }
}

app.get('/mockups', async (req, res) => {
    let title = req.query.title;
    if (title.toLowerCase().includes("sweatshirt")) {
        res.json(sweatshirt_mockups)
    } else {
        res.json(tshirt_mockups)
    }

})

app.get("/infura", async (req, res) => {
    let infura_id = ""
    res.json({
        "key": infura_id
    })

})

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running at https://' + host + ':' + port + '/')
})

function verify_webhook(req) {
    const body = req.rawBody;

    const hash = crypto
    .createHmac("sha256", "key-here")
    .update(body, "utf8", "hex")
    .digest("base64");

    if ( req.get("X-Shopify-Hmac-Sha256") === hash ){
        console.log("hashes matched!")
        return true
    } else {
        return false
    }
    
}

//params: variant title, that is, color and size
//returns: shirt variant id
function getVariantId(variant_title, product_type) {

    let variants = ""

    if (product_type.toLowerCase().includes("sweatshirt")) {
        variants = sweatshirt_data.result.variants;
    } else {
        variants = tshirt_data.result.variants;
    }

    for (var i = 0; i < variants.length; i++) {
        if (variants[i].name.includes(variant_title)) {
            return variants[i].id
        }
    }
}

function getOrderTemplate(shipping_info) {
    const order = JSON.parse(JSON.stringify(order_template))
    order.recipient.name = shipping_info.first_name
    order.recipient.address1 = shipping_info.address1
    order.recipient.address2 = shipping_info.address2
    order.recipient.city = shipping_info.city
    order.recipient.state_code = shipping_info.province_code
    order.recipient.country_code = shipping_info.country_code
    order.recipient.zip = shipping_info.zip

    order.items = []

    order.packing_slip.email = ""
    order.packing_slip.phone = ""
    order.packing_slip.message = "Welcome to the NF2Wear family!"
    order.packing_slip.logo_url = "https://i.ibb.co/LCGjNZP/Modern-Letter-W-Wild-Stell-Logo-11.png"

    return order

}

async function getItemTemplate(body) {

    let is_small_size = false
    //if it is a sweatshirt it needs to account for sizes S to use a different print file
    if (body.title.toLowerCase().includes("sweatshirt")) {
        if (body.variant_title.includes("/ S")) {
            is_small_size = true
        }
    } else { //if it is a shirt it doesn't care
        is_small_size = false;
    }


    let item = {}
    item.variant_id = getVariantId(body.variant_title, body.title) // e.g. body.variant_title =  M / Red   &  item.variant_id = 3430
    item.quantity = body.quantity
    item.files = []
    item.files[0] = {}
    item.files[0].type = "front"
    console.log("start")
    console.log(process.memoryUsage())
    item.files[0].url = await getPrintFileUrl(body.properties[0].value, is_small_size)
    console.log("after")
    console.log(process.memoryUsage())
    item.files[1] = {}
    item.files[1].type = "sleeve_right"
    let shortened_data_link = await shorten(body.properties[1].value)
    let qr_code_link = await uploadQrToServer(shortened_data_link, body.title)
    item.files[1].url = qr_code_link
    item.files[2] = {}
    item.files[2].type = "mockup"

    return item

}

async function shorten (url) {
    const headers = {
        "Content-Type": "application/json",
        "apikey": "",
      }
      
    let endpoint = "https://api.rebrandly.com/v1/links";
  let linkRequest = {
    destination: url,
    domain: { fullName: "rebrand.ly" }
    //, slashtag: "A_NEW_SLASHTAG"
    //, title: "Rebrandly YouTube channel"
  }
  const apiCall = {
      method: 'post',
      url: endpoint,
      data: linkRequest,
      headers: headers
  }
  let apiResponse = await axios(apiCall);
  let link = apiResponse.data;
  return link.shortUrl;
}

async function sendOrderToPrintful(order) {
    let response = await fetch("https://api.printful.com/orders", {
        headers: {
            Authorization: "Basic {key-here}",
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(order)
    })

    // console.log(response)
}

async function uploadQrToServer(link, product_type) {
    /**
     * QRCode generation 
     */
    const response = await axios.post(
        'https://qrcode3.p.rapidapi.com/qrcode/text',
        {
            data: link,
            image: {
                /**
                 * Instead of downloading an image from external server every time, 
                 * consider to use LinQR storage to speedup requests
                 */
                uri: 'https://cdn.shopify.com/s/files/1/0605/4251/7430/products/15_720x.png?v=1648225331',
                modules: false
            },
            style: {
                module: { color: 'black', shape: "lightround" },
                inner_eye: { color: 'black', shape: "lightround" },
                outer_eye: { color: 'black', shape: "lightround" },
                background: {
                    color: "#ffffff"
                }
            },
            size: { width: 800, "quiet_zone": 4 },
            output: { format: 'png' }
        },
        {
            headers: { 'x-rapidapi-key': LINQR_RAPIDAPI_KEY },
            responseType: 'arraybuffer'
        }
    );

    //here we get the png image as a buffer
    const buffer = Buffer.from(response.data, "utf-8")

    let print_file_metadata = ""
    if (product_type.toLowerCase().includes("sweatshirt")) {
        print_file_metadata = await sharp("./images/Sleeve sweatshirt.png").metadata()
    }
    else {
        print_file_metadata = await sharp("./images/Sleeve tshirt.png").metadata()
    }

    
    /////////////////////small qr code
    let resized_qr_image_size = Math.round(print_file_metadata["width"]/2);
    let resized_qr_image = await sharp(buffer)
        .resize(resized_qr_image_size, resized_qr_image_size)
        .png()
        .toBuffer()
 

    let print_file = ""

    //////////////////small qr code image
    let left  = Math.round((print_file_metadata["width"] - resized_qr_image_size)/2)
    if (product_type.toLowerCase().includes("sweatshirt")) {
        print_file = await sharp("./images/Sleeve sweatshirt.png")
            .composite([{ input: resized_qr_image, left: left, top: 0 }])
            .sharpen()
            .png()
            .toBuffer()
    } else { //if it is a tshirt
        print_file = await sharp("./images/Sleeve tshirt.png")
            .composite([{ input: resized_qr_image, left: left, top: 0  }])
            .sharpen()
            .png()
            .toBuffer()
    }

    



    //converting the image into a fomrat that is accepted by the imgbb api (base64 format)
    let print_file_binary = print_file.toString('base64')


    /**
     * Storing image at ImgBB for 86400 seconds 1 day.
     * It will be available as an downloadable URL
     */
    const form_data = new FormData();
    form_data.append('expiration', 10000);
    form_data.append('key', IMG_BB_KEY);
    form_data.append('image', print_file_binary);

    const imgbb_response = await axios.post(
        'https://api.imgbb.com/1/upload',
        form_data,
        { headers: form_data.getHeaders() }
    );

    return imgbb_response.data.data.url
}

async function getPrintFileUrl(img_url, is_small) {

    let result;
    let url;
    try {
        result = await deepai.callStandardApi("torch-srgan", {
            image: img_url
        });
        url = await result.output_url
    } catch (err) {
        console.log("deepai error")
    }




    const plain_nft_data = await axios.get(img_url, { responseType: 'arraybuffer' })
    const plain_nft_buffer = Buffer.from(plain_nft_data.data, "utf-8")

    const enhanced_nft_data = await axios.get(url, { responseType: 'arraybuffer' })
    const enhanced_nft_buffer = Buffer.from(enhanced_nft_data.data, "utf-8")

    //
    let print_template = ""

    if (is_small) {
        print_template = await sharp("./images/S.png")
    } else {
        print_template = await sharp("./images/Sketch001.png")
    }

    const print_template_metadata = await print_template.metadata()
    //

    const resized_nft_image = await sharp(plain_nft_buffer)
        .resize(Math.round(0.8 * print_template_metadata["width"]), Math.round(0.7 * print_template_metadata["height"]), { fit: "inside" })
        .png()
        .toBuffer()

    const nft = await sharp(resized_nft_image)
    const nft_image_metadata = await nft.metadata()

    const nft1 = await sharp(resized_nft_image)
        .sharpen()
        .png()
        .toBuffer()



    const enhanced_nft_image = await sharp(enhanced_nft_buffer)
        .resize(nft_image_metadata["width"], nft_image_metadata["height"])
        .png()
        .toBuffer()

    const map = await sharp(nft1)
        .composite([{ input: enhanced_nft_image, blend: "out" }])
        .sharpen()
        .png()
        .toBuffer()

    const final_nft = await sharp(map)
        .composite([{ input: enhanced_nft_image, blend: "out" }])
        .sharpen()
        .png()
        .toBuffer()


    let print_file = ""

    if (is_small) {
        print_file = await sharp("./images/S.png")
            .composite([{ input: final_nft }])
            .sharpen()
            .png()
            .toBuffer()
    } else {
        print_file = await sharp("./images/Sketch001.png")
            .composite([{ input: final_nft }])
            .sharpen()
            .png()
            .toBuffer()
    }


    let print_file_binary = print_file.toString('base64')


    /**
     * Storing image at ImgBB for 86400 seconds - 1 day.
     * It will be available as an downloadable URL
     */
    const form_data = new FormData();
    form_data.append('expiration', 10000);
    form_data.append('key', IMG_BB_KEY);
    form_data.append('image', print_file_binary);

    const imgbb_response = await axios.post(
        'https://api.imgbb.com/1/upload',
        form_data,
        { headers: form_data.getHeaders() }
    );

    return imgbb_response.data.data.url
}
