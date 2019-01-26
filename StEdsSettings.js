const fs = require('fs');
const path = require('path');
let cfg = path.resolve(process.cwd(), '.env');
let outF = cfg;

class Store {
  constructor() {
    this.data = {}
    this.initStore()
    this.path  = this.get('envfileName')||path.resolve(process.cwd(), '.env');
    this.machine = this.data.machine.name;
    this.mode = this.get('database.current');
    this.DbSettings = this.get(`database.${this.mode}`);
    this.useFullHistory = this.DbSettings.useFullHistory;
  
    this.store = this.data;
    this.set = this.set.bind(this);
    this.get = this.get.bind(this);
    this.getSettings = this.get.bind(this);
    this.setSettings = this.set.bind(this);
    this.update = this.update.bind(this);
    this.tweakVal = this.tweakVal.bind(this);
    this.initStore = this.initStore.bind(this);
    this.outputEnv = this.outputEnv.bind(this);
    this.getAllSettings = this.getAllSettings.bind(this);
    this.flattenObj = this.flattenObj.bind(this);
  
  }
  getAllSettings(){return this.store;}
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
    this.outputEnv(data, this.path);
  }
  outputEnv(data, outF) {
    const outData = data
      .map(([tag, val]) => {
        return `${tag}=${val}`;
      })
      .join('\n');
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
};




const store = new Store();


module.exports  = store;