require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();


const mongoose = require('mongoose');
const dns = require('dns');
const urlparser = require('url');
// Basic Configuration

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

mongoose.connect(process.env.MONGO_DB)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.log('MongoDB Connection Error', err));

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const Url = mongoose.model('Url', urlSchema);


// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  console.log(req.body)
  const url = req.body.url
  const hostname = urlparser.parse(url).hostname;
  
  if(!hostname) {
    return res.json({ error: "invalid url"});
  }
  
  dns.lookup(hostname, async ( err, address ) =>{
    if (err || !address) {
      res.json({ error: "invalid url"});
    } else {
      const urlCount = await Url.countDocuments();
      const newUrl = new Url({
        original_url: url,
        short_url: urlCount +1
      });

      try {
        const result= await newUrl.save();
        res.json({ original_url: url, short_url: result.short_url});
      } catch (error) {
        res.status(500).json({ error: "Server error"});
      }
    }
  });
}); 

app.get('/api/shorturl/:short_url', async (req, res) => {
    const short_url = req.params.short_url
    const urlDoc = await Url.findOne({ short_url: +short_url})
    res.redirect(urlDoc.url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
