const express = require('express');
const app = express();
// const tfi = require('tools-for-instagram');
const path = require('path');
const fetch = require('node-fetch');
const axios = require('axios');
const fs = require('fs');
const Jimp = require("jimp");
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.post('/api/postInstagram', async(req, res) =>{
    console.log(JSON.stringify(req.body));
    res.status(200).json(req.body);
    // try {

    //     // 0. Functions
        
    //         // 0.1 Remove all files in a specific directory
    //         const removeDir = function(path) {
    //             if (fs.existsSync(path)) {
    //             const files = fs.readdirSync(path)
            
    //             if (files.length > 0) {
    //                 files.forEach(function(filename) {
    //                 if (fs.statSync(path + "/" + filename).isDirectory()) {
    //                     removeDir(path + "/" + filename)
    //                 } else {
    //                     fs.unlinkSync(path + "/" + filename)
    //                 }
    //                 })
    //             } else {
    //                 console.log("No files found in the directory.")
    //             }
    //             } else {
    //             console.log("Directory path not found.")
    //             }
    //         }
            
    //         // 0.2 Converting UNIX to normal Time Stamp
    //         function timeConverter(UNIX_timestamp){
    //             let a = new Date(UNIX_timestamp * 1000);
    //             let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    //             let year = a.getFullYear();
    //             let month = months[a.getMonth()];
    //             let date = a.getDate();
    //             let hour = a.getHours();
    //             let min = a.getMinutes();
    //             let sec = a.getSeconds();
    //             let time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    //             return time;
    //         }

    //     // 1. Data Extraction from Request Body 
    //         const response = await fetch('https://finnhub.io/api/v1/news?category=general&token=buchvdv48v6trhm1k80g').then(response => response.json());
    //         let latestNews = response[response.length-1]

    //         // Take information of the news
    //         let imageUrl = latestNews.image;
    //         let headline = latestNews.headline;
    //         let date = timeConverter(latestNews.datetime);

    //     // 2.  Generate Image HTML
    //         const data = {
    //             html: `<div class='box' style='height: 500px; width: 500px; margin: 20px; border: 1px solid; text-align: center;'><h2>${headline}</h2><p>${date}<p><img src='${imageUrl}' width='300' height='300'></div>`,
    //             css: ".box { color: white; background-color: #0f79b9; padding: 10px; font-family: Roboto }",
    //             google_fonts: "Roboto"
    //         }

    //         let headers = { 
    //             auth: {
    //                 username: process.env.IMG_GENERATOR_ID,
    //                 password: process.env.IMG_GENERATOR_PW
    //             },
    //             headers: {
    //             'Content-Type': 'application/json'
    //             }
    //         }

    //         let generatedImage = await axios.post('https://hcti.io/v1/image', JSON.stringify(data), headers)

    //     // 3. Download Image to Local
    //         const url = generatedImage.data.url;
    //         const imageFetch = await fetch(url);
    //         const buffer = await imageFetch.buffer();
    //         fs.writeFile(path.join(__dirname, "/images/image.png"), buffer, () => console.log('finished downloading!'));

    //         // 3.1 Convert file to JPG suitable for Instagram Upload
    //         Jimp.read(path.join(__dirname, "/images/image.png"), function (err, image) {
    //         if (err) {
    //             console.log(err)
    //         } else {
    //             image.write(path.join(__dirname, "/images/image.jpg"))
    //         }
    //     })

    //     // 4. Sign in to Instagram and Upload Picture
    //         let ig = await login(); 
    //         let myPicturePath = path.join(__dirname, '/images/image.jpg');;
    //         let image = await uploadPicture(ig, headline, myPicturePath);   

    //     // 5. Delete the image 
    //         const pathToDir = path.join(__dirname, "/images")
    //         removeDir(pathToDir)
    //         res.json({message: 'Image Uploaded!'})
        
    // }catch(error){
    //     res.status(400).json({err:error})
    // }
})

let port = process.env.PORT || 8085;  

app.listen(port, () => {
    console.log(`Listening to Port ${port}`)
})