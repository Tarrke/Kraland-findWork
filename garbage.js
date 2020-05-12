client.get(url)
  .then( async (response) => {
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

    let lineCount = 0;
    let readAllLines = true;

    await provinces.forEach( async (value, index) => {
      let p_name = value.title;
      let p_id = parseInt(value.href.substring(12));
      console.log(p_name, ":", p_id);
      lineCount++;
      let province = await provinceModel.findOneAndUpdate(
        { "province_id": p_id}, 
        {"updated": Date.now(), "name": p_name}, 
        { new: true, upsert: true}
      );
      /*
      //var province = new provinceModel({name: p_name, province_id: p_id});
      
      // Should save only if there is no other instance of this province already
      // province.save( (error) => {
      await province.findOneAndUpdate({province_id: p_id}, {p_name: 'updated'}, {
        new: true,
        upsert: true
      });
      */

      // did we reach the end ?
      if( --lineCount === 0 && readAllLines ) {
        // we've inserted everything
        // db.close();
      }
      /*
        if( error ) {
          console.log(error);
        }
        if( --lineCount === 0 && readAllLines ) {
          // we've inserted everything
          db.close();
        }
      })
      */
      province = null;
    })

    db.close();

    /*
    var province = new provinceModel({name: pName, province_id: pId});
    province.save();
    province = null;
    */
    // db.close();
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