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
  province_id: Number   
}); 
var townModel = mongoose.model('Town', townSchema);

var provinceSchema = mongoose.Schema({
  name: String,
  province_id: Number,
  updated: { type: Date, default: Date.now }
});
var provinceModel = mongoose.model('Province', provinceSchema);



// Get all Provinces
let url = 'http://www.kraland.org/map.php';

client.get(url)
  .then( response => {
    // Parser les informations
    console.log(response.status);
    console.log(response.config.url);

    /*
    let html = parse(response.data)
    console.log(html.structure);
    */
    let provinces = []
    let payload = cheerio.load(response.data);
    payload('area').each( (i,e)=> {
      provinces[i] = e.attribs;
    });

    console.log(provinces[0]);


    provinces.forEach( (value, index) => {
      let p_name = value.title;
      let p_id = parseInt(value.href.substring(12));
      console.log(p_name, ":", p_id);
      var province = new provinceModel({name: p_name, province_id: p_id});
      province.save( (error) => console.log(error) )
      province = null;
    });

    /*
    var province = new provinceModel({name: pName, province_id: pId});
    province.save();
    province = null;
    */
    db.close();
  })
  .catch(error => {
    console.log(error);
  });

/*
client.get('http://kraland.org/map.php?p=1_30_81')
  .then(response => {
    console.log(response.status);
    console.log(response.config.url);
    // console.log(response.data);

    const html = parse(response.data);

    console.log(html.structure);
  })
  .catch(error => {
    console.log(error);
  });
*/


 

/* TODO: clean
var db = mongoose.connection; 
db.on('error', console.error.bind(console, 'Erreur lors de la connexion')); 
db.once('open', function (){
    console.log("Connexion à la base OK");

     
    var townModel = mongoose.model('Town', townSchema);
    var bottine = new townModel({ nom: "Bottine", town_id: 81, province_id: 30});
    bottine.save(function (err) {
        if (err) return console.error(err);
      });
    // Déconnexion
    // db.close();
}); 
*/
/* TODO: clean
const root = parse('<ul id="list"><li>Hello World</li></ul>');
 
console.log(root.firstChild.structure);
*/