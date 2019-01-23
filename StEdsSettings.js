const fs = require('fs');
const path = require('path');
const logit = require('logit')(__filename);
let cfg = path.resolve(process.cwd(), '.env');
let outF = cfg;

class Store {
  constructor() {
    this.data = {}
    this.initStore()
    this.outFile  = this.get('envfileName')||path.resolve(process.cwd(), '.env');

    this.machine = this.get('machine.name');
    this.mode = this.get('database.current');
    this.DbSettings = this.get(`database.${exports.mode}`);
    this.useFullHistory = this.DbSettings().useFullHistory;
  
  
    this.set = this.set.bind(this);
    this.get = this.get.bind(this);
    this.getSettings = this.get;
    this.setSettings = this.set;
    this.update = this.update.bind(this);
    this.tweakVal = this.tweakVal.bind(this);
    this.initStore = this.initStore.bind(this);
    this.outputEnv = this.outputEnv.bind(this);
    this.flattenObj = this.flattenObj.bind(this);
  
  }
  update(key, val) {
    let keys = key.split(/[_.]/)
    if (keys[0]==='STEDS') keys.shift();
    const last = keys.pop();
    let loc = keys.reduce((l, k) => {
      if (!l[k]) l[k] = last.match(/^[0-9]$/) ? [] : {};
      return l[k];
    }, this.data);
    loc[last] = this.tweakVal(val);
  }
  set(key, val){
    this.update(key,val);
    this.save();

  }
  get(key) {
    let keys = key.split(/[_.]/)
    return keys.reduce((loc, k) => loc && loc[k], this.data);
  }
  tweakVal(val) {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (typeof val ==='string' && val.match(/^[0-9]+$/)) return parseInt(val)
    return val;
  }
  initStore() {
    const ours = Object.entries(process.env).filter(([key, value]) => key.match(/^STEDS_/));
    ours.forEach(item => this.update(...item))
  }
  save(){
    const data = this.flattenObj(this.data, 'STEDS');
    logit('saving\n', data)
    this.outputEnv(data, this.outFile);
  }
  outputEnv(data, outF) {
    const outData = data
      .map(([tag, val]) => {
        // if (typeof val === 'string') val = `"${val}"`;
        return `${tag}=${val}`;
      })
      .join('\n');
    logit('output', outF, '\n', outData);
    return fs.writeFileSync(outF, outData);
  }
  
  flattenObj(obj, base) {
    const fo = [];
    Object.entries(obj).forEach(([key, val]) => {
      const baseN = base + '_' + key;
      let arr = [];
      if (typeof val === 'object') arr = this.flattenObj(val, baseN);
      else arr = [
        [baseN, val]
      ];
      fo.push(...arr);
    });
    return fo;
  }
  // syntactic sugar to support old way of doing it in
  // the sT.eds bookings electron app
 
  // getAllSettings(){ return () => this.data;}
  // getSettings(f) {return this.get(f);}
  // setSettings(field, value){ return set(field, value) ;}
};




// const dotenv = require('dotenv');
// const input = dotenv.config({ path: outF });
// logit('input', input);
const store = new Store();


module.exports  = store;