require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');

const customers = [
  { name: "AA_Try", phone: "917889825292" },
  { name: "QAZI RIYAZ", phone: "917006354075" },
  { name: "WAR SHAB", phone: "919419064288" },
  { name: "NAZIR AHMAD MISGHR", phone: "917006182600" },
  { name: "MOHD AKRAM BEIGH", phone: "919596445496" },
  { name: "MUDASIR NAWSHARA", phone: "919906816409" },
  { name: "SHEIKH SHABIR", phone: "919596518321" },
  { name: "SIDIQUE SHAB", phone: "917006428525" },
  { name: "ABDUL HAMID LONE", phone: "919906891741" },
  { name: "NISAR HUSSAIN", phone: "919906564020" },
  { name: "SHABNAM WHECH-BHR", phone: "918491008756" },
  { name: "YASMEENA JEE", phone: "919149567558" },
  { name: "GH HASSAN WASTA", phone: "919596440077" },
  { name: "NASIR AHMAD DFO", phone: "917006179643" },
  { name: "MIR MANZOOR", phone: "919797193360" },
  { name: "SHOWQAT AHMAD NGR", phone: "919906870680" },
  { name: "BOI WANI", phone: "919906878711" },
  { name: "SUHAIL FOREST", phone: "917780829713" },
  { name: "SHEIKH JAVID", phone: "919796152600" },
  { name: "FAROOQ AH DAR SHEERAZ COLONY", phone: "919622410468" },
  { name: "SHEIKH TAHIR", phone: "919622525555" },
  { name: "BILAL PLUMBER", phone: "919906657003" },
  { name: "UBAID DAR MOHALLAH", phone: "919622946397" },
  { name: "MOHD YASEEN POLICE WLA", phone: "917006348838" },
  { name: "MANZOOR AH DAR", phone: "916005666473" },
  { name: "MAJID KHAN", phone: "919070112252" },
  { name: "WASEEM DULBAGH", phone: "919541003069" },
  { name: "FAROOQ AH BAAGHI", phone: "919906904546" },
  { name: "SAMEER 90-FT", phone: "917006214845" },
  { name: "BILAL AH DAR", phone: "919086565003" },
  { name: "MOHD AKRAM KHAN", phone: "919622263337" },
  { name: "ZUBAIR NAZIR", phone: "917006569552" },
  { name: "MOHD YOUSUF CHAYA", phone: "919541862644" },
  { name: "BILAL SKIMS", phone: "918082476482" },
  { name: "YOUNIS BEIGH", phone: "916006335233" },
  { name: "MURSALEEN", phone: "919797199347" },
  { name: "MUDASIR AH TELI NUNAR", phone: "919682690104" },
  { name: "SHAKIR SKIMS", phone: "917006767501" },
  { name: "MEHRAJ-UD-DIN NAJAR", phone: "917006047311" },
  { name: "JAN BATTERY", phone: "918713836156" },
  { name: "IMRAN JUDI", phone: "919797261691" },
  { name: "IFTEQAR ZARGAR", phone: "917006819446" },
  { name: "SHEIKH SALEEM", phone: "917006684198" },
  { name: "AAJAZ AHMAD DULBAGH", phone: "919797188096" },
  { name: "HILLAL PAYTM", phone: "919810133318" },
  { name: "RIYAZ AHMAD DAR", phone: "919419424931" },
  { name: "QUWAIT WALA", phone: "916006849400" },
  { name: "QUWAIT WLE K BHN", phone: "917006455545" },
  { name: "TARIQ HP", phone: "919596009100" },
  { name: "AAJAZ ASHAYEE", phone: "917051997250" },
  { name: "ZUBAIR JUMMU", phone: "916006012844" },
  { name: "MOHD ISMAEIL BHAT", phone: "919541581254" },
  { name: "MOHD NAQBOOL SKH K NAWASA", phone: "919103821239" },
  { name: "IMTEYAZ GREEN-VALLEY", phone: "917006085763" },
  { name: "JAVID AH BILLAL-COLONY", phone: "916005466803" },
  { name: "KHUSHEED AH TRAFFIC WLA", phone: "917006880143" },
  { name: "NASEER AH NOWSHARA", phone: "917006703302" },
  { name: "FEROZ AHANGAR", phone: "919796135503" },
  { name: "MOHD ASHRAF AHANGAR", phone: "919797863222" },
  { name: "MOHD SHAFI DAR AHNCHAR", phone: "919682324894" },
  { name: "MOULWI MUSHTAQ SHAB", phone: "917006305280" },
  { name: "Manzoor Ahmad Pintu", phone: "919419503305" },
  { name: "Mudasir Azim", phone: "919596222228" },
  { name: "Farooq Ah Khanyar (fruit Wla)", phone: "918899613772" },
  { name: "GH. Nabi Beigh", phone: "919810154623" },
  { name: "Shabir AliJan", phone: "919906779270" },
  { name: "Shawqat Ah Teli", phone: "919149729672" },
  { name: "Owais Hotel", phone: "917006227908" },
  { name: "Khursheed Ah RangSaaz", phone: "919697722264" },
  { name: "Nazir Ah Pathwari", phone: "919797397250" }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const existing = await Customer.countDocuments();
    if (existing > 0) {
      console.log(`⚠️  Database already has ${existing} customers. Skipping seed.`);
      console.log('   To re-seed, delete all customers from the DB first.');
    } else {
      await Customer.insertMany(customers);
      console.log(`✅ Successfully seeded ${customers.length} customers into MongoDB!`);
    }
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connection closed.');
  }
}

seed();
