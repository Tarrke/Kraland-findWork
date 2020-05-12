import { parse } from 'node-html-parser';
import axios from 'axios';
import mongoose from 'mongoose';
import cheerio from 'cheerio';



// axios configuration
const client = axios.create({
  // baseURL: BACKEND_URL
});
client.defaults.headers['Content-Type'] = 'application/json';

// Mongoose configuration
var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } }
options = {};
// DB connexino string
var urlmongo = "mongodb://localhost:27017/kraland";
// DB Connexion
mongoose.connect(urlmongo, options);

var db = mongoose.connection; 
db.on('error', console.error.bind(console, 'Erreur lors de la connexion'));
db.on('open', () => { console.log("database connexion OK") });
db.on('close', () => { console.log("database disconnected") });

// Creating schemas:
var townSchema = mongoose.Schema({
  name: String, 
  town_id: Number,
  province_id: Number,
  updated: { type: Date, default: Date.now },
  map_url: String
}); 
var townModel = mongoose.model('Town', townSchema);

var provinceSchema = mongoose.Schema({
  name: String,
  province_id: Number,
  updated: { type: Date, default: Date.now }
});
var provinceModel = mongoose.model('Province', provinceSchema);


async function getProvinces(url) {
  console.log("inside getProvinces:", url);
  let respPromise = client.get(url);
  console.log("Waiting for promise");
  let resp = await respPromise;
  console.log(resp.config.url + ':', resp.status);
  
  // Get our province list
  let provinces = []
  let payload = cheerio.load(resp.data);
  payload('area').each( (i,e)=> {
    provinces[i] = e.attribs;
  });
  // console.log(provinces[0]);

  // Parse the list and insertOrUpdate the data in DB
  await Promise.all( provinces.map( async (provinceData) => {
    let p_name = provinceData.title;
    let p_id = parseInt(provinceData.href.substring(12));
    // console.log(p_name, ":", p_id);
    await provinceModel.findOneAndUpdate(
      { "province_id": p_id}, 
      {"updated": Date.now(), "name": p_name}, 
      { new: true, upsert: true}
    );

    // Town list update
    // TODO: make check if needs updates...
    if( true ) {
      console.log('updating ' + p_name + '...');
      let towns = [];
      // Do something...
      let url = 'http://kraland.org/map.php?p=1_'+p_id;
      let respPromise = client.get(url);
      let resp = await respPromise;
      console.log(resp.config.url + ':', resp.status);
      let payload = cheerio.load(resp.data);
      // console.log(payload('script')[1].children[0].data);
      let shouldAdd = true;
      payload('select[name=city] option').each( (i,e) => {
        // console.log(e);
        // console.log(shouldAdd);
        if( e.attribs.value === '0' ) {
          // We got a dummy option
          // console.log("dummy option");
          // console.log(e.children[0].data)
          if( String(e.children[0].data).startsWith('--') ) {
            // this should be the delimiter we are looking for
            // console.log("delimiter ?");
            shouldAdd = false;
          }
          return;
        }

        if( shouldAdd ) {
          // console.log(e.attribs.value);
          // console.log(e.children[0].data);
          let t_name = e.children[0].data;
          let t_id = String(e.attribs.value).split('_')[1];
          let p_id = String(e.attribs.value).split('_')[0];
          console.log(t_name + ':', t_id);
          console.log(e.attribs);
          towns.push({name: t_name, t_id: t_id, p_id: p_id});
        }
      });

      await Promise.all( towns.map( async (e,i) => {
        let t_name = e.name;
        let t_id = e.t_id;
        let p_id = e.p_id;
        await townModel.findOneAndUpdate(
          {town_id: t_id},
          {province_id: p_id, "updated": Date.now(), "name": t_name, map_url: 'http://kraland.org/map?p=1_'+p_id+'_'+t_id},
          {new: true, upsert: true}
        );
      }));
    }
  }));
}

// Main function
(async function(){
  // Get all Provinces
  let url = 'http://www.kraland.org/map.php';
  await getProvinces(url);
  console.log("toto");
  db.close();
})();
